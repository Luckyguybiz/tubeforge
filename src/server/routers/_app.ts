import { router } from '../trpc';
import { userRouter } from './user';
import { projectRouter } from './project';
import { sceneRouter } from './scene';
import { youtubeRouter } from './youtube';
import { aiRouter } from './ai';
import { billingRouter } from './billing';
import { adminRouter } from './admin';
import { videoTaskRouter } from './videoTask';
import { teamRouter } from './team';
import { assetRouter } from './asset';
import { folderRouter } from './folder';
import { referralRouter } from './referral';
import { analyticsRouter } from './analytics';

export const appRouter = router({
  user: userRouter,
  project: projectRouter,
  scene: sceneRouter,
  youtube: youtubeRouter,
  ai: aiRouter,
  billing: billingRouter,
  admin: adminRouter,
  videoTask: videoTaskRouter,
  team: teamRouter,
  asset: assetRouter,
  folder: folderRouter,
  referral: referralRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
