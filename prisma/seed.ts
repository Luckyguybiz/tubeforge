/**
 * N8 — Prisma seed script.
 *
 * Seeds the database with test users across all plan tiers:
 *   - FREE user: 2 projects, 3 AI generations used
 *   - PRO user:  10 projects, 50 AI generations used
 *   - STUDIO user: 1 project, 0 AI generations used
 *
 * Each user has scenes and realistic data for development/testing.
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *   npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up existing seed data (idempotent)
  const seedEmails = [
    'free-user@tubeforge.test',
    'pro-user@tubeforge.test',
    'studio-user@tubeforge.test',
  ];

  for (const email of seedEmails) {
    await prisma.user.deleteMany({ where: { email } });
  }

  // ── FREE user: 2 projects, 3 AI generations ──────────────

  const freeUser = await prisma.user.create({
    data: {
      name: 'Free User',
      email: 'free-user@tubeforge.test',
      plan: 'FREE',
      role: 'USER',
      aiUsage: 3,
      aiResetAt: new Date(),
      onboardingDone: true,
      referralCode: 'SEED_FREE',
      projects: {
        create: [
          {
            title: 'My First Video',
            description: 'A test project for the free tier.',
            tags: ['test', 'tutorial'],
            status: 'DRAFT',
            scenes: {
              create: [
                { prompt: 'Introduction scene', label: 'Intro', duration: 5, order: 0, status: 'READY', model: 'standard' },
                { prompt: 'Main content', label: 'Content', duration: 10, order: 1, status: 'EDITING', model: 'standard' },
                { prompt: 'Outro', label: 'Outro', duration: 3, order: 2, status: 'EMPTY', model: 'standard' },
              ],
            },
          },
          {
            title: 'Quick Tutorial',
            description: 'Another free project.',
            tags: ['tutorial'],
            status: 'READY',
            scenes: {
              create: [
                { prompt: 'Step 1: Setup', label: 'Step 1', duration: 8, order: 0, status: 'READY', model: 'turbo' },
                { prompt: 'Step 2: Build', label: 'Step 2', duration: 12, order: 1, status: 'READY', model: 'turbo' },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`  Created FREE user: ${freeUser.id} (${freeUser.email})`);

  // ── PRO user: 10 projects, 50 AI generations ─────────────

  const proUser = await prisma.user.create({
    data: {
      name: 'Pro User',
      email: 'pro-user@tubeforge.test',
      plan: 'PRO',
      role: 'USER',
      aiUsage: 50,
      aiResetAt: new Date(),
      onboardingDone: true,
      referralCode: 'SEED_PRO',
      stripeId: 'cus_seed_pro',
      projects: {
        create: Array.from({ length: 10 }, (_, i) => ({
          title: `Pro Project ${i + 1}`,
          description: `Project ${i + 1} from the PRO tier.`,
          tags: ['pro', `project-${i + 1}`],
          status: i < 3 ? 'PUBLISHED' as const : i < 7 ? 'READY' as const : 'DRAFT' as const,
          scenes: {
            create: Array.from({ length: Math.min(i + 2, 5) }, (_, j) => ({
              prompt: `Scene ${j + 1} of project ${i + 1}`,
              label: `Scene ${j + 1}`,
              duration: 5 + j * 2,
              order: j,
              status: j === 0 ? 'READY' as const : 'EDITING' as const,
              model: j % 2 === 0 ? 'standard' : 'pro',
            })),
          },
        })),
      },
    },
  });

  console.log(`  Created PRO user: ${proUser.id} (${proUser.email})`);

  // ── STUDIO user: 1 project, 0 AI generations ─────────────

  const studioUser = await prisma.user.create({
    data: {
      name: 'Studio User',
      email: 'studio-user@tubeforge.test',
      plan: 'STUDIO',
      role: 'USER',
      aiUsage: 0,
      aiResetAt: new Date(),
      onboardingDone: true,
      referralCode: 'SEED_STUDIO',
      stripeId: 'cus_seed_studio',
      projects: {
        create: [
          {
            title: 'Studio Masterpiece',
            description: 'A cinematic production from the Studio tier.',
            tags: ['cinematic', 'studio', 'premium'],
            status: 'RENDERING',
            scenes: {
              create: [
                { prompt: 'Epic opening shot', label: 'Opening', duration: 15, order: 0, status: 'READY', model: 'cinematic' },
                { prompt: 'Character introduction', label: 'Characters', duration: 20, order: 1, status: 'GENERATING', model: 'cinematic' },
                { prompt: 'Plot development', label: 'Plot', duration: 30, order: 2, status: 'EDITING', model: 'pro' },
                { prompt: 'Climactic scene', label: 'Climax', duration: 25, order: 3, status: 'EMPTY', model: 'cinematic' },
                { prompt: 'Resolution and credits', label: 'Credits', duration: 10, order: 4, status: 'EMPTY', model: 'standard' },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`  Created STUDIO user: ${studioUser.id} (${studioUser.email})`);

  // ── Summary ──────────────────────────────────────────────

  const userCount = await prisma.user.count();
  const projectCount = await prisma.project.count();
  const sceneCount = await prisma.scene.count();

  console.log(`\nSeed complete!`);
  console.log(`  Total users: ${userCount}`);
  console.log(`  Total projects: ${projectCount}`);
  console.log(`  Total scenes: ${sceneCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
