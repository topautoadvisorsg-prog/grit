import type { Express, Request } from "express";

import { isAuthenticated, isAdmin } from '../../auth/replitAuth';
import { db } from "../../db";
import { userPicks, insertUserPickSchema, events, eventFights } from "../../../shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { createPickSchema } from '../../schemas';

export function registerPicksRoutes(app: Express): void {
  // Get user's picks for a specific event
  app.get("/api/picks/event/:eventId", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const { eventId } = req.params;

      // Get all fights for the event
      const fights = await db
        .select()
        .from(eventFights)
        .where(eq(eventFights.eventId, eventId));

      const fightIds = fights.map(f => f.id);

      // Get user's picks for these fights
      if (fightIds.length === 0) {
        return res.json([]);
      }

      const picks = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            inArray(userPicks.fightId, fightIds)
          )
        );

      res.json(picks);
    } catch (error) {
      logger.error("Error fetching picks:", error);
      res.status(500).json({ message: "Failed to fetch picks" });
    }
  });

  // Get user's pick for a specific fight
  app.get("/api/picks/fight/:fightId", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const { fightId } = req.params;

      const [pick] = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.fightId, fightId)
          )
        );

      res.json(pick || null);
    } catch (error) {
      logger.error("Error fetching pick:", error);
      res.status(500).json({ message: "Failed to fetch pick" });
    }
  });

  // Create or update a pick
  app.post("/api/picks", isAuthenticated, validate(createPickSchema), async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const validationResult = insertUserPickSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid data", errors: validationResult.error.issues });
      }

      const pickData = validationResult.data;

      // Check if fight exists and get event date
      const [fight] = await db
        .select()
        .from(eventFights)
        .where(eq(eventFights.id, pickData.fightId));

      if (!fight) {
        return res.status(404).json({ message: "Fight not found" });
      }

      // Get event to check if fight has started
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, fight.eventId));

      if (event) {
        // Check if event status allows pick modifications (only Upcoming)
        // Admin can bypass this check
        if (event.status !== 'Upcoming' && !isAdmin(req)) {
          return res.status(400).json({ message: "Picks can only be modified when event status is 'Upcoming'" });
        }
      }

      // Check for existing pick
      const [existingPick] = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.fightId, pickData.fightId)
          )
        );

      let result;
      if (existingPick) {
        // Check if pick is locked (admin can bypass)
        if (existingPick.isLocked && !isAdmin(req)) {
          return res.status(400).json({ message: "Pick is locked and cannot be modified" });
        }

        [result] = await db
          .update(userPicks)
          .set({
            pickedFighterId: pickData.pickedFighterId,
            pickedMethod: pickData.pickedMethod,
            pickedRound: pickData.pickedRound,
            units: pickData.units || 1,
            updatedAt: new Date(),
          })
          .where(eq(userPicks.id, existingPick.id))
          .returning();
      } else {
        // Create new pick
        [result] = await db
          .insert(userPicks)
          .values(pickData)
          .returning();
      }

      res.json(result);
    } catch (error) {
      logger.error("Error saving pick:", error);
      res.status(500).json({ message: "Failed to save pick" });
    }
  });

  // Delete a pick
  app.delete("/api/picks/:fightId", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const { fightId } = req.params;

      // Check if fight exists and get event date
      const [fight] = await db
        .select()
        .from(eventFights)
        .where(eq(eventFights.id, fightId));

      if (fight) {
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, fight.eventId));

        if (event && event.status !== 'Upcoming') {
          return res.status(400).json({ message: "Picks can only be deleted when event status is 'Upcoming'" });
        }
      }

      const [pick] = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.fightId, fightId)
          )
        );

      if (pick?.isLocked) {
        return res.status(400).json({ message: "Pick is locked and cannot be deleted" });
      }

      await db
        .delete(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.fightId, fightId)
          )
        );

      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting pick:", error);
      res.status(500).json({ message: "Failed to delete pick" });
    }
  });

  // Get all picks for current user
  app.get("/api/picks", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = req.user.id;

      const picks = await db
        .select()
        .from(userPicks)
        .where(eq(userPicks.userId, userId));

      res.json(picks);
    } catch (error) {
      logger.error("Error fetching all picks:", error);
      res.status(500).json({ message: "Failed to fetch picks" });
    }
  });
}
