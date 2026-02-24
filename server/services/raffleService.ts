import { db } from "../db";
import { raffleTickets, raffleDraws } from "../../shared/schema";
import { users } from "../../shared/models/auth";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// ──────────────────────────────────────
// Raffle Ticket Operations
// ──────────────────────────────────────

export async function allocateTickets(userId: string, quantity: number, source: string = 'admin', eventId?: string) {
    const [ticket] = await db.insert(raffleTickets)
        .values({
            id: uuidv4(),
            userId,
            quantity,
            source,
            eventId: eventId || null,
            createdAt: new Date(),
        })
        .returning();

    return ticket;
}

// ──────────────────────────────────────
// Raffle Draw Operations
// ──────────────────────────────────────

export async function executeDraw(eventId?: string, poolDescription?: string) {
    const allTickets = await db.select({
        userId: raffleTickets.userId,
        total: sql<number>`SUM(${raffleTickets.quantity})`,
    })
        .from(raffleTickets)
        .groupBy(raffleTickets.userId);

    if (allTickets.length === 0) {
        throw new Error('NO_TICKETS');
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

    return { draw, winner };
}
