import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';

/* ═══════════════════════════════════════════════════════════════════
   SSE Collaboration Stream

   Streams real-time collaboration events to connected clients.
   Events: user_joined, user_left, cursor_move, content_updated,
           scene_locked, scene_unlocked

   Scoped per projectId (query param). Authenticated via session.
   ═══════════════════════════════════════════════════════════════════ */

export interface CollaborationUser {
  id: string;
  name: string;
  image: string | null;
  color: string;
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'cursor_move' | 'content_updated' | 'scene_locked' | 'scene_unlocked';
  user: CollaborationUser;
  data?: Record<string, unknown>;
  timestamp: number;
}

/** Assign distinct colors to collaborators */
const CURSOR_COLORS = [
  '#3a7bfd', '#2dd4a0', '#8b5cf6', '#f59e0b',
  '#06b6d4', '#ec4899', '#ef4444', '#10b981',
];

/** Map: projectId -> Set of { controller, userId } */
type Client = {
  controller: ReadableStreamDefaultController;
  userId: string;
  user: CollaborationUser;
  lastActivity: number;
};

const projectClients = new Map<string, Set<Client>>();

/** Scene locks: projectId -> Map<sceneId, { userId, lockedAt }> */
const sceneLocks = new Map<string, Map<string, { userId: string; user: CollaborationUser; lockedAt: number }>>();

/** Lock timeout in ms (2 minutes) */
const LOCK_TIMEOUT_MS = 2 * 60 * 1000;

function getClientsForProject(projectId: string): Set<Client> {
  if (!projectClients.has(projectId)) {
    projectClients.set(projectId, new Set());
  }
  return projectClients.get(projectId)!;
}

function getLocksForProject(projectId: string): Map<string, { userId: string; user: CollaborationUser; lockedAt: number }> {
  if (!sceneLocks.has(projectId)) {
    sceneLocks.set(projectId, new Map());
  }
  return sceneLocks.get(projectId)!;
}

function assignColor(projectId: string, userId: string): string {
  const clients = getClientsForProject(projectId);
  const usedColors = new Set<string>();
  for (const c of clients) {
    if (c.userId !== userId) usedColors.add(c.user.color);
  }
  for (const color of CURSOR_COLORS) {
    if (!usedColors.has(color)) return color;
  }
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

function sendSSE(controller: ReadableStreamDefaultController, event: CollaborationEvent) {
  try {
    const data = JSON.stringify(event);
    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
  } catch {
    // Client disconnected — ignore
  }
}

function broadcastToProject(projectId: string, event: CollaborationEvent, excludeUserId?: string) {
  const clients = getClientsForProject(projectId);
  for (const client of clients) {
    if (excludeUserId && client.userId === excludeUserId) continue;
    sendSSE(client.controller, event);
  }
}

/** Release expired scene locks and broadcast unlock events */
function cleanupExpiredLocks(projectId: string) {
  const locks = getLocksForProject(projectId);
  const now = Date.now();
  for (const [sceneId, lock] of locks) {
    if (now - lock.lockedAt > LOCK_TIMEOUT_MS) {
      locks.delete(sceneId);
      broadcastToProject(projectId, {
        type: 'scene_unlocked',
        user: lock.user,
        data: { sceneId },
        timestamp: now,
      });
    }
  }
}

/** Exported for use by broadcast/lock endpoints */
export { broadcastToProject, getClientsForProject, getLocksForProject, cleanupExpiredLocks, sceneLocks, LOCK_TIMEOUT_MS };

// ─── Zod validation schema for POST body ───────────────────────

const collaborationEventSchema = z.object({
  projectId: z.string().min(1).max(100),
  type: z.enum(['cursor_move', 'scene_locked', 'scene_unlocked', 'content_updated']),
  data: z.record(z.string(), z.unknown()).optional(),
});

// ─── Project authorization helper ──────────────────────────────

/**
 * Verify that the user owns the project or is a member of the project's team.
 * Returns true if authorized, false otherwise.
 */
async function verifyProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { userId: true, teamId: true },
  });

  if (!project) return false;

  // Owner has access
  if (project.userId === userId) return true;

  // Team member has access
  if (project.teamId) {
    const membership = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId } },
    });
    if (membership) return true;

    // Team owner also has access (they may not be in TeamMember table)
    const team = await db.team.findUnique({
      where: { id: project.teamId },
      select: { ownerId: true },
    });
    if (team?.ownerId === userId) return true;
  }

  return false;
}

// ─── GET: SSE stream ───────────────────────────────────────────

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return new Response('Missing projectId', { status: 400 });
  }

  // Verify user has access to this project
  const hasAccess = await verifyProjectAccess(projectId, session.user.id);
  if (!hasAccess) {
    return new Response('Forbidden: no access to this project', { status: 403 });
  }

  const userId = session.user.id;
  const color = assignColor(projectId, userId);
  const collaborationUser: CollaborationUser = {
    id: userId,
    name: session.user.name || 'Anonymous',
    image: session.user.image || null,
    color,
  };

  let clientRef: Client | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const client: Client = {
        controller,
        userId,
        user: collaborationUser,
        lastActivity: Date.now(),
      };
      clientRef = client;

      const clients = getClientsForProject(projectId);
      clients.add(client);

      // Send current state to the new client: who is online + active locks
      const onlineUsers: CollaborationUser[] = [];
      for (const c of clients) {
        if (c.userId !== userId) {
          onlineUsers.push(c.user);
        }
      }

      // Cleanup any expired locks
      cleanupExpiredLocks(projectId);

      const locks = getLocksForProject(projectId);
      const activeLocks: Record<string, CollaborationUser> = {};
      for (const [sceneId, lock] of locks) {
        activeLocks[sceneId] = lock.user;
      }

      // Send initial state as a special event
      sendSSE(controller, {
        type: 'user_joined',
        user: collaborationUser,
        data: {
          onlineUsers,
          activeLocks,
          isInitial: true,
        },
        timestamp: Date.now(),
      });

      // Broadcast join to others
      broadcastToProject(projectId, {
        type: 'user_joined',
        user: collaborationUser,
        timestamp: Date.now(),
      }, userId);
    },
    cancel() {
      if (clientRef) {
        const clients = getClientsForProject(projectId);
        clients.delete(clientRef);

        // Release any locks held by this user
        const locks = getLocksForProject(projectId);
        for (const [sceneId, lock] of locks) {
          if (lock.userId === userId) {
            locks.delete(sceneId);
            broadcastToProject(projectId, {
              type: 'scene_unlocked',
              user: collaborationUser,
              data: { sceneId },
              timestamp: Date.now(),
            });
          }
        }

        // Broadcast leave
        broadcastToProject(projectId, {
          type: 'user_left',
          user: collaborationUser,
          timestamp: Date.now(),
        });

        // Cleanup empty project entries
        if (clients.size === 0) {
          projectClients.delete(projectId);
          sceneLocks.delete(projectId);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ─── POST: Broadcast event to project ──────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Rate limiting: 60 requests per 60 seconds (cursor moves are frequent)
  const { success: rlOk, reset } = await rateLimit({
    identifier: `collab:${userId}`,
    limit: 60,
    window: 60,
  });
  if (!rlOk) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  // Zod validation
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = collaborationEventSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { projectId, type, data } = parsed.data;

  // Project authorization
  const hasAccess = await verifyProjectAccess(projectId, userId);
  if (!hasAccess) {
    return Response.json({ error: 'Forbidden: no access to this project' }, { status: 403 });
  }
  const clients = getClientsForProject(projectId);

  // Find the sender's user info
  let senderUser: CollaborationUser | null = null;
  for (const c of clients) {
    if (c.userId === userId) {
      senderUser = c.user;
      c.lastActivity = Date.now();
      break;
    }
  }

  if (!senderUser) {
    return new Response('Not connected to project', { status: 403 });
  }

  // Handle lock/unlock events
  if (type === 'scene_locked' && data?.sceneId) {
    const locks = getLocksForProject(projectId);
    cleanupExpiredLocks(projectId);
    const sceneId = data.sceneId as string;
    const existing = locks.get(sceneId);
    if (existing && existing.userId !== userId) {
      return Response.json({ error: 'Scene already locked', lockedBy: existing.user }, { status: 409 });
    }
    locks.set(sceneId, { userId, user: senderUser, lockedAt: Date.now() });
  }

  if (type === 'scene_unlocked' && data?.sceneId) {
    const locks = getLocksForProject(projectId);
    const sceneId = data.sceneId as string;
    const existing = locks.get(sceneId);
    if (existing && existing.userId === userId) {
      locks.delete(sceneId);
    }
  }

  const event: CollaborationEvent = {
    type,
    user: senderUser,
    data,
    timestamp: Date.now(),
  };

  // For cursor moves, only broadcast to others (not back to sender)
  broadcastToProject(projectId, event, userId);

  return Response.json({ ok: true });
}
