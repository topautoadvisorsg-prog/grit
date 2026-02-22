
import { userPicks, eventFights } from "../../shared/schema";
import { db } from "../db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface IPickStorage {
    lockPicksForEvent(eventId: string): Promise<number>;
    scoreEventPicks(eventId: string): Promise<number>;
}

export class PickStorage implements IPickStorage {
    async lockPicksForEvent(eventId: string): Promise<number> {
        // Get all fights for this event
        const fights = await db.select().from(eventFights).where(eq(eventFights.eventId, eventId));
        const fightIds = fights.map(f => f.id);

        if (fightIds.length === 0) return 0;

        // Lock all picks for these fights
        await db.update(userPicks)
            .set({ isLocked: true, updatedAt: new Date() })
            .where(inArray(userPicks.fightId, fightIds));

        return fightIds.length;
    }

    async scoreEventPicks(eventId: string): Promise<number> {
        // DEPRECATED: Scoring is now handled per-fight via fightResultsRoutes.ts
        // This method is kept for interface compatibility but no longer processes picks.
        logger.warn(`[DEPRECATED] scoreEventPicks called for event ${eventId}. Scoring is handled per-fight now.`);
        return 0;
    }
}
