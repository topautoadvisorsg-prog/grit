import { db } from "../db";
import { leaderboardSnapshots, users } from "../../shared/models/auth";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function createLeaderboardSnapshot(
    type: 'event' | 'monthly' | 'weekly' = 'event',
    eventId?: string
) {
    const allUsers = await db.select({
        id: users.id,
        username: users.username,
        totalPoints: users.totalPoints,
    })
        .from(users)
        .orderBy(desc(users.totalPoints));

    const rankings = allUsers.map((user, index) => ({
        userId: user.id,
        rank: index + 1,
        totalPoints: user.totalPoints,
        username: user.username || undefined,
    }));

    const [snapshot] = await db.insert(leaderboardSnapshots)
        .values({
            id: uuidv4(),
            snapshotType: type,
            eventId: eventId || null,
            snapshotDate: new Date(),
            rankings,
            createdAt: new Date(),
        })
        .returning();

    return snapshot;
}
