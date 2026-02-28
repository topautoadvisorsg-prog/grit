import 'dotenv/config';
import './config/env';
import './types/express';
import express from "express";
import { setupAuth, registerAuthRoutes, registerReplitOIDCRoutes } from "./replit_integrations/auth";
import { isAuthenticated } from "./auth/guards";

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
import { registerUploadRoutes } from "./user/routes/uploadRoutes";
import paymentRouter from "./user/routes/paymentRoutes";
import { registerStripeWebhook } from "./api/webhooks/stripeWebhook";
import heartbeatRouter from "./system/heartbeat";
import { socketService } from "./services/socketService";
import path from "path";
import { logger } from "./utils/logger";
import { publicApiLimiter, strictApiLimiter, authApiLimiter, aiChatLimiter } from './middleware/rateLimiter';

async function startUserServer() {
    const app = express();

    // Register Stripe webhook BEFORE global JSON middleware
    registerStripeWebhook(app);

    app.use(express.json({ limit: '50mb' }));

    // Shared Auth (Passport & Session)
    await setupAuth(app);
    registerAuthRoutes(app);
    registerReplitOIDCRoutes(app);

    // Rate limits
    app.use('/api/fighters', publicApiLimiter);
    app.use('/api/events', publicApiLimiter);
    app.use('/api/news', publicApiLimiter);
    app.use('/api/leaderboard', publicApiLimiter);
    app.use('/api/tags', publicApiLimiter);

    app.use('/api/chat', aiChatLimiter);
    app.use('/api/ai', aiChatLimiter);

    app.use('/api/picks', authApiLimiter);
    app.use('/api/me', authApiLimiter);

    // User App Specific Routes
    registerFighterImageRoutes(app);
    registerFighterRoutes(app);
    registerEventRoutes(app);
    registerUserRoutes(app);
    registerPicksRoutes(app);
    registerLeaderboardRoutes(app);
    registerFightResultsRoutes(app);
    registerNewsRoutes(app);
    registerChatRoutes(app);
    registerSnapshotRoutes(app);
    registerAIRoutes(app);
    registerAIChatRoutes(app);
    registerTagRoutes(app);
    registerRaffleRoutes(app);
    registerStatsRoutes(app);
    registerDashboardRoutes(app);
    registerProgressionRoutes(app);
    app.use(badgeRoutes);
    app.use('/api', userSettingsRoutes);

    app.use('/objects', express.static(path.join(process.cwd(), 'uploads')));
    registerUploadRoutes(app);
    app.use(paymentRouter);

    app.use('/api/system', heartbeatRouter);

    const PORT = process.env.USER_PORT || process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
        logger.info(`User API server running on port ${PORT}`);
    });

    socketService.init(server);
}

startUserServer().catch((err) => logger.error(err));
