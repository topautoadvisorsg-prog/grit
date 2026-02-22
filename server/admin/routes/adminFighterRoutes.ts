import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { storage } from "../../storage";
import { insertFighterSchema } from "../../../shared/schema";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { bulkFightersSchema, bulkFightsSchema } from '../../schemas';

export function registerAdminFighterRoutes(app: Express) {
  app.post("/api/fighters/bulk", isAuthenticated, requireAdmin, validate(bulkFightersSchema), async (req: Request, res: Response) => {
    try {
      const { fighters: fightersData } = req.body;
      if (!Array.isArray(fightersData)) {
        return res.status(400).json({ error: "Expected array of fighters" });
      }

      const created: any[] = [];
      const errors: any[] = [];

      for (const fighterData of fightersData) {
        try {
          const validationResult = insertFighterSchema.safeParse(fighterData);
          if (!validationResult.success) {
            errors.push({
              fighter: fighterData.firstName + " " + fighterData.lastName,
              error: validationResult.error.issues
            });
            continue;
          }

          const existing = await storage.getFighter((fighterData as any).id);
          if (existing) {
            const updated = await storage.updateFighter((fighterData as any).id, validationResult.data);
            created.push(updated);
          } else {
            const fighter = await storage.createFighter(validationResult.data);
            created.push(fighter);

            const fullName = `${fighter.firstName} ${fighter.lastName}`;
            await storage.linkUnlinkedFightHistory(fullName, fighter.id);
          }
        } catch (err) {
          errors.push({
            fighter: fighterData.firstName + " " + fighterData.lastName,
            error: String(err)
          });
        }
      }

      res.status(201).json({
        created: created.length,
        errors: errors.length,
        fighters: created,
        errorDetails: errors
      });
    } catch (error) {
      logger.error("Error in bulk create:", error);
      res.status(500).json({ error: "Failed to bulk create fighters" });
    }
  });

  app.post("/api/fighters/:id/relink", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const fighter = await storage.getFighter(req.params.id as string);
      if (!fighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }
      const fullName = `${fighter.firstName} ${fighter.lastName}`;
      const linked = await storage.linkUnlinkedFightHistory(fullName, fighter.id);
      res.json({ linked, fighterName: fullName });
    } catch (error) {
      logger.error("Error re-linking fights:", error);
      res.status(500).json({ error: "Failed to re-link fights" });
    }
  });

  app.put("/api/fights/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateFightHistory(req.params.id as string, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Fight record not found" });
      }
      res.json(updated);
    } catch (error) {
      logger.error("Error updating fight history:", error);
      res.status(500).json({ error: "Failed to update fight record" });
    }
  });

  app.delete("/api/fights/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteFightHistoryRecord(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Fight record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting fight history:", error);
      res.status(500).json({ error: "Failed to delete fight record" });
    }
  });

  app.post("/api/fights/bulk", isAuthenticated, requireAdmin, validate(bulkFightsSchema), async (req: Request, res: Response) => {
    try {
      const { fights: fightsData, mode = 'add' } = req.body;
      if (!Array.isArray(fightsData)) {
        return res.status(400).json({ error: "Expected array of fight records" });
      }

      const created: any[] = [];
      const updated: any[] = [];
      const errors: any[] = [];

      for (const fightData of fightsData) {
        try {
          if (mode === 'replace' && fightData.id) {
            const existing = await storage.updateFightHistory(fightData.id, fightData);
            if (existing) {
              updated.push(existing);
              continue;
            }
          }
          const fight = await storage.createFightHistory(fightData);
          created.push(fight);
        } catch (err) {
          errors.push({
            fight: `${fightData.fighterName || fightData.fighterId} vs ${fightData.opponentName}`,
            error: String(err)
          });
        }
      }

      res.status(201).json({
        created: created.length,
        updated: updated.length,
        errors: errors.length,
        fights: [...created, ...updated],
        errorDetails: errors
      });
    } catch (error) {
      logger.error("Error in bulk fight import:", error);
      res.status(500).json({ error: "Failed to bulk import fight history" });
    }
  });

  app.post("/api/fighters/:id/import-history", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!csvData) {
        return res.status(400).json({ error: "Missing csvData" });
      }

      const { handleFighterHistoryImport } = await import("../../statsIngest");
      const results = await handleFighterHistoryImport(req.params.id as string, csvData);

      res.json(results);
    } catch (error) {
      logger.error("Error importing history:", error);
      res.status(500).json({ error: "Failed to import history", details: String(error) });
    }
  });
}
