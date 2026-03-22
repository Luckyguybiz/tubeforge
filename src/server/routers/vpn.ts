import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { encrypt, decrypt } from '@/lib/crypto';
import { generateWireGuardKeys, allocateIp, generateConfig, addPeerToServer, removePeerFromServer } from '@/lib/wireguard';
import { createLogger } from '@/lib/logger';

const log = createLogger('vpn');

// VPN promo codes — read from env (JSON string) with fallback to defaults.
// Format: VPN_PROMO_CODES='{"TUBEFORGE-VPN-TEST":{"maxUses":100},"YOUTUBE-ACCESS-2026":{"maxUses":50}}'
function loadPromoCodes(): Record<string, { maxUses: number }> {
  const envCodes = process.env.VPN_PROMO_CODES;
  if (envCodes) {
    try {
      return JSON.parse(envCodes) as Record<string, { maxUses: number }>;
    } catch {
      log.warn('Failed to parse VPN_PROMO_CODES env var, using defaults');
    }
  }
  // Fallback defaults
  return {
    'TUBEFORGE-VPN-TEST': { maxUses: 100 },
    'YOUTUBE-ACCESS-2026': { maxUses: 50 },
  };
}

const VALID_PROMOS: Record<string, { maxUses: number }> = loadPromoCodes();

// In-memory usage counter for promo codes
const promoUsageCount = new Map<string, number>();

/** Get current usage count for a promo code */
function getPromoUsage(code: string): number {
  return promoUsageCount.get(code) ?? 0;
}

/** Increment usage count for a promo code */
function incrementPromoUsage(code: string): void {
  const newCount = getPromoUsage(code) + 1;
  promoUsageCount.set(code, newCount);

  // Warn when approaching maxUses (80% threshold)
  const promo = VALID_PROMOS[code];
  if (promo) {
    const threshold = Math.floor(promo.maxUses * 0.8);
    if (newCount >= threshold) {
      log.warn('Promo code approaching maxUses limit', {
        code,
        currentUsage: newCount,
        maxUses: promo.maxUses,
        remaining: promo.maxUses - newCount,
      });
    }
  }
}

/** Shared helper: generate VPN config for a user (creates peer, registers on server) */
async function generateVpnForUser(ctx: { db: any; session: { user: { id: string } } }) {
  const userId = ctx.session.user.id;

  // Check existing config
  const existing = await ctx.db.vpnPeer.findUnique({ where: { userId } });

  if (existing && existing.active) {
    const privateKey = decrypt(existing.encryptedPrivKey);
    const config = generateConfig(privateKey, existing.assignedIp);
    return { config, assignedIp: existing.assignedIp, createdAt: existing.createdAt, active: true };
  }

  // If revoked, delete old and create new
  if (existing && !existing.active) {
    await ctx.db.vpnPeer.delete({ where: { id: existing.id } });
  }

  // Generate new config
  const keys = generateWireGuardKeys();
  const ip = await allocateIp();
  const encryptedPrivKey = encrypt(keys.privateKey);

  const peer = await ctx.db.vpnPeer.create({
    data: {
      userId,
      publicKey: keys.publicKey,
      encryptedPrivKey,
      assignedIp: ip,
    },
  });

  // Register peer on WireGuard server
  try {
    addPeerToServer(keys.publicKey, ip);
    log.info('VPN peer added', { userId, ip });
  } catch (err) {
    // Rollback DB entry if server registration fails
    await ctx.db.vpnPeer.delete({ where: { id: peer.id } });
    log.error('Failed to add VPN peer to server', { userId, error: String(err) });
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to configure VPN' });
  }

  const config = generateConfig(keys.privateKey, ip);
  return { config, assignedIp: ip, createdAt: peer.createdAt, active: true };
}

export const vpnRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const peer = await ctx.db.vpnPeer.findUnique({
      where: { userId: ctx.session.user.id },
      select: { assignedIp: true, active: true, createdAt: true, revokedAt: true },
    });
    return { peer, plan: ctx.session.user.plan };
  }),

  getConfig: protectedProcedure.query(async ({ ctx }) => {
    // Rate limit: 3 per minute
    const { success } = await rateLimit({ identifier: `vpn-config:${ctx.session.user.id}`, limit: 3, window: 60 });
    if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });

    // Plan gate: if FREE and no existing active peer, deny access
    const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id }, select: { plan: true } });
    if (!user) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'VPN requires Pro or Studio plan' });
    }
    if (user.plan === 'FREE') {
      // Allow FREE users who already have an active peer (e.g. from promo code)
      const existingPeer = await ctx.db.vpnPeer.findUnique({ where: { userId: ctx.session.user.id } });
      if (!existingPeer?.active) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'VPN requires Pro or Studio plan' });
      }
    }

    return generateVpnForUser(ctx);
  }),

  unlockWithPromo: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 5 per minute
      const { success } = await rateLimit({ identifier: `vpn-promo:${ctx.session.user.id}`, limit: 5, window: 60 });
      if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });

      const normalizedCode = input.code.toUpperCase();
      const promo = VALID_PROMOS[normalizedCode];
      if (!promo) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid promo code' });
      }

      // Enforce maxUses limit
      if (getPromoUsage(normalizedCode) >= promo.maxUses) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Promo code has reached its maximum usage limit' });
      }

      // Check if user already has VPN access
      const existing = await ctx.db.vpnPeer.findUnique({ where: { userId: ctx.session.user.id } });
      if (existing?.active) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'VPN already active' });
      }

      // Generate VPN config (bypasses plan check)
      await generateVpnForUser(ctx);
      incrementPromoUsage(normalizedCode);
      log.info('VPN unlocked via promo', { userId: ctx.session.user.id, code: normalizedCode, usageCount: getPromoUsage(normalizedCode) });

      return { success: true };
    }),

  revokeConfig: protectedProcedure.mutation(async ({ ctx }) => {
    const { success } = await rateLimit({ identifier: `vpn-revoke:${ctx.session.user.id}`, limit: 5, window: 60 });
    if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });

    const peer = await ctx.db.vpnPeer.findUnique({ where: { userId: ctx.session.user.id } });
    if (!peer || !peer.active) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No active VPN config found' });
    }

    await ctx.db.vpnPeer.update({
      where: { id: peer.id },
      data: { active: false, revokedAt: new Date() },
    });

    try {
      removePeerFromServer(peer.publicKey);
    } catch (err) {
      log.error('Failed to remove VPN peer from server', { userId: ctx.session.user.id, error: String(err) });
    }

    log.info('VPN peer revoked', { userId: ctx.session.user.id });
    return { success: true };
  }),
});
