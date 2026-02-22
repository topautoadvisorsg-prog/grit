import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { storage } from "../../storage";
import { createLeaderboardSnapshot } from "../../services/leaderboardService";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { updateEventSchema, updateEventStatusSchema } from '../../schemas';

export function registerAdminEventRoutes(app: Express) {
  app.put("/api/events/:id", isAuthenticated, requireAdmin, validate(updateEventSchema), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body;

      const existingEvent = await storage.getEvent(id as string);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      const updateData: Partial<typeof body> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.date !== undefined) updateData.date = body.date;
      if (body.venue !== undefined) updateData.venue = body.venue;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.state !== undefined) updateData.state = body.state;
      if (body.country !== undefined) updateData.country = body.country;
      if (body.organization !== undefined) updateData.organization = body.organization;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status;

      const updatedEvent = await storage.updateEvent(id as string, updateData);
      if (!updatedEvent) {
        return res.status(500).json({ error: "Failed to update event" });
      }

      const fights = await storage.getEventFights(id as string);
      res.json({ ...updatedEvent, fights });
    } catch (error) {
      logger.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.put("/api/events/:id/status", isAuthenticated, requireAdmin, validate(updateEventStatusSchema), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const VALID_TRANSITIONS: Record<string, string[]> = {
        'Upcoming': ['Live', 'Cancelled', 'Postponed'],
        'Live': ['Completed', 'Cancelled'],
        'Completed': ['Closed'],
        'Closed': ['Archived'],
        'Postponed': ['Upcoming', 'Cancelled'],
      };

      const event = await storage.getEvent(id as string);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const allowed = VALID_TRANSITIONS[event.status];
      if (!allowed || !allowed.includes(status)) {
        return res.status(400).json({
          error: `Invalid transition: ${event.status} → ${status}. Allowed: ${(allowed || []).join(', ') || 'none'}`,
        });
      }

      if (status === 'Live' && event.status !== 'Live') {
        await storage.lockPicksForEvent(id as string);
      }

      if (status === 'Closed' && event.status !== 'Closed') {
        await createLeaderboardSnapshot('event', id as string);
      }

      const updated = await storage.updateEvent(id as string, { status });
      res.json(updated);
    } catch (error) {
      logger.error("Error updating event status:", error);
      res.status(500).json({ error: "Failed to update event status" });
    }
  });

  app.put("/api/events/:eventId/fights/:fightId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { fightId } = req.params;
      const body = req.body;

      const updateData: Record<string, any> = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.cardPlacement !== undefined) updateData.cardPlacement = body.cardPlacement;
      if (body.boutOrder !== undefined) updateData.boutOrder = body.boutOrder;
      if (body.rounds !== undefined) updateData.rounds = body.rounds;
      if (body.isTitleFight !== undefined) updateData.isTitleFight = body.isTitleFight;

      const updated = await storage.updateEventFight(fightId as string, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Fight not found" });
      }
      res.json(updated);
    } catch (error) {
      logger.error("Error updating fight:", error);
      res.status(500).json({ error: "Failed to update fight" });
    }
  });

  app.delete("/api/events/:eventId/fights/:fightId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { fightId } = req.params;
      const deleted = await storage.deleteEventFight(fightId as string);
      if (!deleted) {
        return res.status(404).json({ error: "Fight not found" });
      }
      res.json({ success: true, message: "Fight removed" });
    } catch (error) {
      logger.error("Error deleting fight:", error);
      res.status(500).json({ error: "Failed to delete fight" });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const existingEvent = await storage.getEvent(id as string);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      await storage.deleteEventFights(id as string);
      await storage.deleteEvent(id as string);

      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      logger.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
}
