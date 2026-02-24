import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { logger } from '../../utils/logger';
import * as raffleService from '../../services/raffleService';

/**
 * Admin raffle management routes.
 * All business logic delegated to raffleService.
 * Admin access is enforced by requireAdmin middleware.
 */
export function registerAdminRaffleRoutes(app: Express) {

  app.post("/api/admin/raffle/allocate", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, quantity, source, eventId } = req.body;

      if (!userId || !quantity || quantity < 1) {
        return res.status(400).json({ error: "Valid userId and quantity (>= 1) required" });
      }

      const ticket = await raffleService.allocateTickets(userId, quantity, source, eventId);
      res.status(201).json(ticket);
    } catch (error) {
      logger.error("Error allocating raffle tickets:", error);
      res.status(500).json({ error: "Failed to allocate tickets" });
    }
  });

  app.post("/api/admin/raffle/draw", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId, poolDescription } = req.body;
      const result = await raffleService.executeDraw(eventId, poolDescription);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'NO_TICKETS') {
        return res.status(400).json({ error: "No tickets in the pool" });
      }
      logger.error("Error executing raffle draw:", error);
      res.status(500).json({ error: "Failed to execute raffle draw" });
    }
  });
}
