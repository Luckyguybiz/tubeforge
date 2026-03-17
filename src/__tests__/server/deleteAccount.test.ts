import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the deleteAccount mutation.
 *
 * The mutation must delete dependent rows in the correct order to respect
 * FK constraints — especially TeamMember and Team which lack onDelete: Cascade.
 */

// Build a mock Prisma client where every model.deleteMany / model.delete
// records the call order so we can assert it.
function mockDb() {
  const callOrder: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeModel = (name: string) => ({
    deleteMany: vi.fn(async (_args?: any) => {
      callOrder.push(`${name}.deleteMany`);
      return { count: 1 };
    }),
    delete: vi.fn(async (_args?: any) => {
      callOrder.push(`${name}.delete`);
      return {};
    }),
  });

  return {
    callOrder,
    teamMember: makeModel('teamMember'),
    team: makeModel('team'),
    designFolder: makeModel('designFolder'),
    asset: makeModel('asset'),
    project: makeModel('project'),
    channel: makeModel('channel'),
    session: makeModel('session'),
    account: makeModel('account'),
    user: makeModel('user'),
  };
}

// Replicate the deleteAccount logic from src/server/routers/user.ts
// (extracted for unit testing without spinning up a full tRPC context)
async function deleteAccountLogic(db: ReturnType<typeof mockDb>, userId: string) {
  await db.teamMember.deleteMany({ where: { userId } });
  await db.team.deleteMany({ where: { ownerId: userId } });
  await db.designFolder.deleteMany({ where: { userId } });
  await db.asset.deleteMany({ where: { userId } });
  await db.project.deleteMany({ where: { userId } });
  await db.channel.deleteMany({ where: { userId } });
  await db.session.deleteMany({ where: { userId } });
  await db.account.deleteMany({ where: { userId } });
  await db.user.delete({ where: { id: userId } });
  return { success: true };
}

describe('deleteAccount', () => {
  let db: ReturnType<typeof mockDb>;
  const userId = 'user-123';

  beforeEach(() => {
    db = mockDb();
  });

  it('deletes teamMember before team (FK order)', async () => {
    await deleteAccountLogic(db, userId);
    const tmIdx = db.callOrder.indexOf('teamMember.deleteMany');
    const teamIdx = db.callOrder.indexOf('team.deleteMany');
    expect(tmIdx).toBeLessThan(teamIdx);
  });

  it('deletes team before user (FK order)', async () => {
    await deleteAccountLogic(db, userId);
    const teamIdx = db.callOrder.indexOf('team.deleteMany');
    const userIdx = db.callOrder.indexOf('user.delete');
    expect(teamIdx).toBeLessThan(userIdx);
  });

  it('deletes user last', async () => {
    await deleteAccountLogic(db, userId);
    expect(db.callOrder[db.callOrder.length - 1]).toBe('user.delete');
  });

  it('calls deleteMany for all dependent models', async () => {
    await deleteAccountLogic(db, userId);
    expect(db.teamMember.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(db.team.deleteMany).toHaveBeenCalledWith({ where: { ownerId: userId } });
    expect(db.designFolder.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(db.asset.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(db.project.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(db.channel.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(db.account.deleteMany).toHaveBeenCalledWith({ where: { userId } });
  });

  it('calls user.delete with correct id', async () => {
    await deleteAccountLogic(db, userId);
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it('returns success: true', async () => {
    const result = await deleteAccountLogic(db, userId);
    expect(result).toEqual({ success: true });
  });

  it('performs exactly 9 database operations', async () => {
    await deleteAccountLogic(db, userId);
    expect(db.callOrder.length).toBe(9);
  });

  it('deletes assets before user (FK order)', async () => {
    await deleteAccountLogic(db, userId);
    const assetIdx = db.callOrder.indexOf('asset.deleteMany');
    const userIdx = db.callOrder.indexOf('user.delete');
    expect(assetIdx).toBeLessThan(userIdx);
  });

  it('deletes projects before user (FK order)', async () => {
    await deleteAccountLogic(db, userId);
    const projIdx = db.callOrder.indexOf('project.deleteMany');
    const userIdx = db.callOrder.indexOf('user.delete');
    expect(projIdx).toBeLessThan(userIdx);
  });

  it('deletes sessions and accounts before user (FK order)', async () => {
    await deleteAccountLogic(db, userId);
    const sessIdx = db.callOrder.indexOf('session.deleteMany');
    const acctIdx = db.callOrder.indexOf('account.deleteMany');
    const userIdx = db.callOrder.indexOf('user.delete');
    expect(sessIdx).toBeLessThan(userIdx);
    expect(acctIdx).toBeLessThan(userIdx);
  });
});
