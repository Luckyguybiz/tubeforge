import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userData = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      projects: { include: { scenes: true } },
      channels: true,
      assets: true,
      ownedTeams: true,
      payouts: true,
    },
  });

  if (!userData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Remove sensitive fields
  const { ...safeData } = userData;
  delete (safeData as any).stripeId;

  return new NextResponse(JSON.stringify(safeData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="tubeforge-data-${session.user.id}.json"`,
    },
  });
}
