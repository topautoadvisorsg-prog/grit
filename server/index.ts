import 'dotenv/config';
import express from "express";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
import { registerAdminRoutes } from "./admin/routes/adminRoutes";
import { registerAdminManagementRoutes } from "./admin/routes/adminManagementRoutes";
import { registerVerificationRoutes } from "./admin/routes/verificationRoutes";
import { registerModerationRoutes } from "./admin/routes/moderationRoutes";
import { registerAdminNewsRoutes } from "./admin/routes/adminNewsRoutes";
import { registerAdminEventRoutes } from "./admin/routes/adminEventRoutes";
import { registerAdminFighterRoutes } from "./admin/routes/adminFighterRoutes";
import { registerAdminSnapshotRoutes } from "./admin/routes/adminSnapshotRoutes";
import { registerAdminFightResultsRoutes } from "./admin/routes/adminFightResultsRoutes";
import { registerAdminUserRoutes } from "./admin/routes/adminUserRoutes";
import { registerAdminAIChatRoutes } from "./admin/routes/adminAIChatRoutes";
import { registerAdminProgressionRoutes } from "./admin/routes/adminProgressionRoutes";
import { registerAdminRaffleRoutes } from "./admin/routes/adminRaffleRoutes";

import { registerFighterImageRoutes } from "./user/routes/fighterImageRoutes";
import { registerFighterRoutes } from "./user/routes/fighterRoutes";
import { registerEventRoutes } from "./user/routes/eventRoutes";
import { registerUserRoutes } from "./user/routes/userRoutes";
import { registerPicksRoutes } from "./user/routes/picksRoutes";
import { registerLeaderboardRoutes } from "./user/routes/leaderboardRoutes";
import { registerFightResultsRoutes } from "./user/routes/fightResultsRoutes";
import { registerNewsRoutes } from "./user/routes/newsRoutes";
import { registerChatRoutes } from "./user/routes/chatRoutes";
import { registerSnapshotRoutes } from "./user/routes/snapshotRoutes";
import { registerAIRoutes } from "./ai/aiRoutes";
import { registerAIChatRoutes } from "./user/routes/aiChatRoutes";
import { registerTagRoutes } from "./user/routes/tagRoutes";
import { registerRaffleRoutes } from "./user/routes/raffleRoutes";
import { registerStatsRoutes } from "./user/routes/statsRoutes";
import { registerDashboardRoutes } from "./user/routes/dashboardRoutes";
import { registerProgressionRoutes } from "./user/routes/progressionRoutes";
import userSettingsRoutes from "./user/routes/userSettingsRoutes";
import badgeRoutes from "./user/routes/badgeRoutes";
import { storage } from "./storage";
import { registerUploadRoutes } from "./user/routes/uploadRoutes";
import path from "path";
import { logger } from "./utils/logger";
import { publicApiLimiter, strictApiLimiter, authApiLimiter } from './middleware/rateLimiter';


async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  await setupAuth(app);
  registerAuthRoutes(app);

  app.use('/api/fighters', publicApiLimiter);
  app.use('/api/events', publicApiLimiter);
  app.use('/api/news', publicApiLimiter);
  app.use('/api/leaderboard', publicApiLimiter);
  app.use('/api/tags', publicApiLimiter);

  app.use('/api/chat', strictApiLimiter);
  app.use('/api/ai', strictApiLimiter);

  app.use('/api/picks', authApiLimiter);
  app.use('/api/me', authApiLimiter);
  app.use('/api/admin', authApiLimiter);

  registerFighterImageRoutes(app);
  registerFighterRoutes(app);
  registerEventRoutes(app);
  registerUserRoutes(app);
  registerPicksRoutes(app);
  registerLeaderboardRoutes(app);
  registerFightResultsRoutes(app);
  registerNewsRoutes(app);
  registerAdminRoutes(app);
  registerAdminNewsRoutes(app);
  registerAdminEventRoutes(app);
  registerAdminFighterRoutes(app);
  registerAdminSnapshotRoutes(app);
  registerAdminFightResultsRoutes(app);
  registerAdminUserRoutes(app);
  registerAdminAIChatRoutes(app);
  registerAdminProgressionRoutes(app);
  registerAdminRaffleRoutes(app);
  registerChatRoutes(app);
  registerModerationRoutes(app);
  registerSnapshotRoutes(app);
  registerAIRoutes(app);
  registerAIChatRoutes(app);
  registerTagRoutes(app);
  registerRaffleRoutes(app);
  registerVerificationRoutes(app);
  registerAdminManagementRoutes(app);
  registerStatsRoutes(app);
  registerDashboardRoutes(app);
  registerProgressionRoutes(app);
  app.use(badgeRoutes);

  app.use('/api', userSettingsRoutes);

  app.use('/objects', express.static(path.join(process.cwd(), 'uploads')));

  registerUploadRoutes(app);

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    logger.info(`API server running on port ${PORT}`);
  });
}

startServer().catch((err) => logger.error(err));
