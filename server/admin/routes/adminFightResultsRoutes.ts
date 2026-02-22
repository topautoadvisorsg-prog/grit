import type { Express, Request } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { db } from "../../db";
import { users, eventFights, fightResults } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from '../../utils/logger';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export function registerAdminFightResultsRoutes(app: Express) {
  app.get("/api/admin/fights", isAuthenticated, requireAdmin, async (req: Request, res) => {
    try {
      const currentUserId = req.user.id;
      const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId));

      if (!currentUser || (currentUser.role !== "admin" && currentUser.email !== ADMIN_EMAIL)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const fights = await db.select().from(eventFights);
      const results = await db.select().from(fightResults);

      const resultsMap = new Map(results.map(r => [r.fightId, r]));

      const fightsWithResults = fights.map(fight => ({
        ...fight,
        result: resultsMap.get(fight.id) || null,
      }));

      res.json(fightsWithResults);
    } catch (error) {
      logger.error("Error fetching admin fights:", error);
      res.status(500).json({ message: "Failed to fetch fights" });
    }
  });
}
