import type { Express, Request, Response } from "express";
import { isAuthenticated } from '../../auth/replitAuth';
import { storage } from "../../storage";
import { insertFighterSchema, type Fighter } from "../../../shared/schema";
import { logger } from '../../utils/logger';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

export function registerFighterRoutes(app: Express) {
  app.get("/api/fighters", async (req: Request, res: Response) => {
    try {
      const fighters = await storage.getAllFighters();
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = fighters.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, fighters.length, params));
      }
      res.json(fighters);
    } catch (error) {
      logger.error("Error fetching fighters:", error);
      res.status(500).json({ error: "Failed to fetch fighters" });
    }
  });

  app.get("/api/fighters/:id", async (req: Request, res: Response) => {
    try {
      const fighter = await storage.getFighter(req.params.id as string);
      if (!fighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }
      res.json(fighter);
    } catch (error) {
      logger.error("Error fetching fighter:", error);
      res.status(500).json({ error: "Failed to fetch fighter" });
    }
  });

  app.post("/api/fighters", isAuthenticated, async (req, res) => {
    try {
      const validationResult = insertFighterSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid fighter data",
          details: (validationResult.error as any).errors
        });
      }

      const fighter = await storage.createFighter(validationResult.data);

      const fullName = `${fighter.firstName} ${fighter.lastName}`;
      await storage.linkUnlinkedFightHistory(fullName, fighter.id);

      res.status(201).json(fighter);
    } catch (error) {
      logger.error("Error creating fighter:", error);
      res.status(500).json({ error: "Failed to create fighter" });
    }
  });

  app.put("/api/fighters/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const existingFighter = await storage.getFighter(req.params.id as string);
      if (!existingFighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }

      const mergedData = { ...existingFighter, ...req.body, lastUpdated: new Date().toISOString() };

      const validationResult = insertFighterSchema.safeParse(mergedData);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid fighter data after merge",
          details: validationResult.error.issues
        });
      }

      const fighter = await storage.updateFighter(req.params.id as string, validationResult.data);
      if (!fighter) {
        return res.status(500).json({ error: "Failed to update fighter" });
      }
      res.json(fighter);
    } catch (error) {
      logger.error("Error updating fighter:", error);
      res.status(500).json({ error: "Failed to update fighter" });
    }
  });

  app.delete("/api/fighters/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteFightHistoryByFighter(req.params.id as string);
      const deleted = await storage.deleteFighter(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Fighter not found" });
      }
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting fighter:", error);
      res.status(500).json({ error: "Failed to delete fighter" });
    }
  });

  app.get("/api/fights", async (req: Request, res: Response) => {
    try {
      const fights = await storage.getAllFightHistory();
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = fights.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, fights.length, params));
      }
      res.json(fights);
    } catch (error) {
      logger.error("Error fetching all fight history:", error);
      res.status(500).json({ error: "Failed to fetch fight history" });
    }
  });

  app.get("/api/fights/unlinked", async (_req: Request, res: Response) => {
    try {
      const { db } = await import("../db");
      const { fightHistory } = await import("../../shared/schema");
      const { eq } = await import("drizzle-orm");
      const unlinked = await db.select().from(fightHistory).where(eq(fightHistory.opponentLinked, false));
      res.json(unlinked);
    } catch (error) {
      logger.error("Error fetching unlinked fights:", error);
      res.status(500).json({ error: "Failed to fetch unlinked fights" });
    }
  });

  app.get("/api/fighters/:id/fights", async (req: Request, res: Response) => {
    try {
      const fights = await storage.getFightHistoryByFighter(req.params.id as string);
      res.json(fights);
    } catch (error) {
      logger.error("Error fetching fight history:", error);
      res.status(500).json({ error: "Failed to fetch fight history" });
    }
  });
}
