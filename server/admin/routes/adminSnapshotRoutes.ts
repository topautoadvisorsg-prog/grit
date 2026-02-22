import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { createLeaderboardSnapshot } from "../../services/leaderboardService";
import { logger } from '../../utils/logger';

export function registerAdminSnapshotRoutes(app: Express) {
  app.post("/api/admin/leaderboard/snapshot", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type = "monthly", eventId } = req.body;

      const snapshot = await createLeaderboardSnapshot(type, eventId);
      res.status(201).json(snapshot);
    } catch (error) {
      logger.error("Error creating snapshot:", error);
      res.status(500).json({ message: "Failed to create snapshot" });
    }
  });
}
