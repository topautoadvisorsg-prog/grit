import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { db } from "../../db";
import { raffleTickets, raffleDraws } from "../../../shared/schema";
import { users } from "../../../shared/models/auth";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

async function isAdmin(req: Request): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    return user?.role === "admin" || user?.email === ADMIN_EMAIL;
}

export function registerAdminRaffleRoutes(app: Express) {
  app.post("/api/admin/raffle/allocate", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!(await isAdmin(req))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId, quantity, source, eventId } = req.body;

      if (!userId || !quantity || quantity < 1) {
        return res.status(400).json({ error: "Valid userId and quantity (>= 1) required" });
      }

      const [ticket] = await db.insert(raffleTickets)
        .values({
          id: uuidv4(),
          userId,
          quantity,
          source: source || 'admin',
          eventId: eventId || null,
          createdAt: new Date(),
        })
        .returning();

      res.status(201).json(ticket);
    } catch (error) {
      logger.error("Error allocating raffle tickets:", error);
      res.status(500).json({ error: "Failed to allocate tickets" });
    }
  });

  app.post("/api/admin/raffle/draw", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!(await isAdmin(req))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { eventId, poolDescription } = req.body;

      const allTickets = await db.select({
        userId: raffleTickets.userId,
        total: sql<number>`SUM(${raffleTickets.quantity})`,
      })
        .from(raffleTickets)
        .groupBy(raffleTickets.userId);

      if (allTickets.length === 0) {
        return res.status(400).json({ error: "No tickets in the pool" });
      }

      const weightedEntries: string[] = [];
      let totalTicketCount = 0;

      for (const entry of allTickets) {
        const count = Number(entry.total);
        totalTicketCount += count;
        for (let i = 0; i < count; i++) {
          weightedEntries.push(entry.userId);
        }
      }

      const winnerIndex = Math.floor(Math.random() * weightedEntries.length);
      const winnerId = weightedEntries[winnerIndex];

      const [draw] = await db.insert(raffleDraws)
        .values({
          id: uuidv4(),
          eventId: eventId || null,
          winnerId,
          totalTickets: totalTicketCount,
          poolDescription: poolDescription || null,
          drawnAt: new Date(),
        })
        .returning();

      const [winner] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
      }).from(users).where(eq(users.id, winnerId));

      res.json({
        draw,
        winner,
      });
    } catch (error) {
      logger.error("Error executing raffle draw:", error);
      res.status(500).json({ error: "Failed to execute raffle draw" });
    }
  });
}
