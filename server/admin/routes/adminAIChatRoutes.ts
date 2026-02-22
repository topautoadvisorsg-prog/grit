import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { db } from "../../db";
import { aiChatConfig, aiChatLogs } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';

export function registerAdminAIChatRoutes(app: Express) {
  app.get("/api/admin/ai/config", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const configs = await db.select().from(aiChatConfig);
      res.json(configs);
    } catch (error) {
      logger.error("Error fetching AI config:", error);
      res.status(500).json({ error: "Failed to fetch AI config" });
    }
  });

  app.post("/api/admin/ai/config", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { section, content } = req.body;
      if (!section || !content) return res.status(400).json({ error: "Missing section or content" });

      const existing = await db.select().from(aiChatConfig).where(eq(aiChatConfig.section, section));

      if (existing.length > 0) {
        await db.update(aiChatConfig)
          .set({ content, updatedAt: new Date(), updatedBy: req.user.id })
          .where(eq(aiChatConfig.section, section));
      } else {
        await db.insert(aiChatConfig).values({
          id: uuidv4(),
          section,
          content,
          updatedBy: req.user.id
        });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error("Error updating AI config:", error);
      res.status(500).json({ error: "Failed to update AI config" });
    }
  });

  app.get("/api/admin/ai/logs", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { limit = 100 } = req.query;
      const logs = await db.select()
        .from(aiChatLogs)
        .orderBy(desc(aiChatLogs.createdAt))
        .limit(Number(limit));
      res.json(logs);
    } catch (error) {
      logger.error("Error fetching AI logs:", error);
      res.status(500).json({ error: "Failed to fetch AI logs" });
    }
  });
}
