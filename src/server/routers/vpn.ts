import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { encrypt, decrypt } from '@/lib/crypto';
import { generateWireGuardKeys, allocateIp, generateConfig, addPeerToServer, removePeerFromServer } from '@/lib/wireguard';
import { createLogger } from '@/lib/logger';

const log = createLogger('vpn');

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

    // Plan gate
    const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id }, select: { plan: true } });
    if (!user || user.plan === 'FREE') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'VPN requires Pro or Studio plan' });
    }

    // Check existing config
    const existing = await ctx.db.vpnPeer.findUnique({ where: { userId: ctx.session.user.id } });

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
        userId: ctx.session.user.id,
        publicKey: keys.publicKey,
        encryptedPrivKey,
        assignedIp: ip,
      },
    });

    // Register peer on WireGuard server
    try {
      addPeerToServer(keys.publicKey, ip);
      log.info('VPN peer added', { userId: ctx.session.user.id, ip });
    } catch (err) {
      // Rollback DB entry if server registration fails
      await ctx.db.vpnPeer.delete({ where: { id: peer.id } });
      log.error('Failed to add VPN peer to server', { userId: ctx.session.user.id, error: String(err) });
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to configure VPN' });
    }

    const config = generateConfig(keys.privateKey, ip);
    return { config, assignedIp: ip, createdAt: peer.createdAt, active: true };
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
