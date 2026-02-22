
import { fighters, type Fighter, type InsertFighter, fightHistory, type FightHistory, type InsertFightHistory } from "../../shared/schema";
import { db } from "../db";
import { eq, desc, and, ilike } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface IFighterStorage {
    getAllFighters(): Promise<Fighter[]>;
    getFighter(id: string): Promise<Fighter | undefined>;
    createFighter(fighter: InsertFighter): Promise<Fighter>;
    updateFighter(id: string, fighter: Partial<InsertFighter>): Promise<Fighter | undefined>;
    deleteFighter(id: string): Promise<boolean>;

    getAllFightHistory(): Promise<FightHistory[]>;
    getFightHistoryByFighter(fighterId: string): Promise<FightHistory[]>;
    createFightHistory(fight: InsertFightHistory): Promise<FightHistory>;
    updateFightHistory(id: string, data: Partial<InsertFightHistory>): Promise<FightHistory | undefined>;
    deleteFightHistoryRecord(id: string): Promise<boolean>;
    deleteFightHistoryByFighter(fighterId: string): Promise<boolean>;
    linkUnlinkedFightHistory(fighterFullName: string, fighterId: string): Promise<number>;
}

export class FighterStorage implements IFighterStorage {
    async getAllFighters(): Promise<Fighter[]> {
        return await db.select().from(fighters);
    }

    async getFighter(id: string): Promise<Fighter | undefined> {
        const [fighter] = await db.select().from(fighters).where(eq(fighters.id, id));
        return fighter || undefined;
    }

    async createFighter(fighter: InsertFighter): Promise<Fighter> {
        const [created] = await db.insert(fighters).values(fighter).returning();
        return created;
    }

    async updateFighter(id: string, fighterData: Partial<InsertFighter>): Promise<Fighter | undefined> {
        const [updated] = await db
            .update(fighters)
            .set(fighterData)
            .where(eq(fighters.id, id))
            .returning();
        return updated || undefined;
    }

    async deleteFighter(id: string): Promise<boolean> {
        const result = await db.delete(fighters).where(eq(fighters.id, id)).returning();
        return result.length > 0;
    }

    async getAllFightHistory(): Promise<FightHistory[]> {
        return await db.select().from(fightHistory).orderBy(desc(fightHistory.eventDate));
    }

    async getFightHistoryByFighter(fighterId: string): Promise<FightHistory[]> {
        return await db.select().from(fightHistory).where(eq(fightHistory.fighterId, fighterId)).orderBy(desc(fightHistory.eventDate));
    }

    async createFightHistory(fight: InsertFightHistory): Promise<FightHistory> {
        const [created] = await db.insert(fightHistory).values(fight).returning();
        return created;
    }

    async updateFightHistory(id: string, data: Partial<InsertFightHistory>): Promise<FightHistory | undefined> {
        const [updated] = await db.update(fightHistory).set(data).where(eq(fightHistory.id, id)).returning();
        return updated || undefined;
    }

    async deleteFightHistoryRecord(id: string): Promise<boolean> {
        const result = await db.delete(fightHistory).where(eq(fightHistory.id, id)).returning();
        return result.length > 0;
    }

    async deleteFightHistoryByFighter(fighterId: string): Promise<boolean> {
        const result = await db.delete(fightHistory).where(eq(fightHistory.fighterId, fighterId)).returning();
        return result.length >= 0;
    }

    async linkUnlinkedFightHistory(fighterFullName: string, fighterId: string): Promise<number> {
        const result = await db
            .update(fightHistory)
            .set({
                opponentId: fighterId,
                opponentLinked: true
            })
            .where(
                and(
                    eq(fightHistory.opponentLinked, false),
                    ilike(fightHistory.opponentName, fighterFullName)
                )
            )
            .returning();

        if (result.length > 0) {
            logger.info(`[Auto-Link] Linked ${result.length} fight history records to fighter "${fighterFullName}" (${fighterId})`);
        }
        return result.length;
    }
}
