import { db } from "../db";
import { leaderboardSnapshots, users, userPicks, eventFights, events } from "../../shared/schema";
import { desc, eq, and, sql, count, avg } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

export async function createLeaderboardSnapshot(
    type: 'event' | 'monthly' | 'weekly' = 'event',
    eventId?: string
) {
    logger.info(`[Leaderboard] Creating snapshot: type=${type}, eventId=${eventId}`);

    // 1. Fetch current pool of users with relevant metrics
    // Metrics needed: Accuracy %, Participation Rate, Recent Accuracy
    const allUsers = await db.select({
        id: users.id,
        username: users.username,
        totalPoints: users.totalPoints,
        starLevel: users.starLevel,
    }).from(users);

    const rankings: any[] = [];

    // 2. Loop through users to calculate weighted scores
    // Formula: (Accuracy % * 0.6) + (Recent 3 Event Accuracy * 0.25) + (Participation Rate * 0.15)
    for (const user of allUsers) {
        try {
            // Participation Rate
            const totalScheduledFights = await db.select({ count: count() })
                .from(eventFights)
                .innerJoin(events, eq(eventFights.eventId, events.id))
                .where(eq(events.status, 'Completed'));

            const userPicksCount = await db.select({ count: count() })
                .from(userPicks)
                .where(eq(userPicks.userId, user.id));

            const totalFights = Number(totalScheduledFights[0]?.count || 1);
            const picks = Number(userPicksCount[0]?.count || 0);
            const participationRate = picks / totalFights;

            // Accuracy % (Total correct / Total picks)
            const correctPicks = await db.select({ count: count() })
                .from(userPicks)
                .where(and(eq(userPicks.userId, user.id), sql`${userPicks.pointsAwarded} > 0`));

            const correctCount = Number(correctPicks[0]?.count || 0);
            const accuracyRate = picks > 0 ? (correctCount / picks) : 0;

            // Recent 3 Event Accuracy
            const recentEvents = await db.select({ id: events.id })
                .from(events)
                .where(eq(events.status, 'Completed'))
                .orderBy(desc(events.date))
                .limit(3);

            let recentAccuracy = 0;
            if (recentEvents.length > 0) {
                const totalRecentIds = recentEvents.map((e: { id: string }) => sql`${e.id}`);
                const recentFightIds = await db.select({ id: eventFights.id })
                    .from(eventFights)
                    .where(sql`${eventFights.eventId} IN (${sql.join(totalRecentIds, sql`, `)})`);

                if (recentFightIds.length > 0) {
                    const fightIdTokens = recentFightIds.map((f: { id: string }) => sql`${f.id}`);
                    const recentPicks = await db.select({
                        total: count(),
                        correct: sql<number>`count(*) filter (where ${userPicks.pointsAwarded} > 0)`
                    })
                        .from(userPicks)
                        .where(and(
                            eq(userPicks.userId, user.id),
                            sql`${userPicks.fightId} IN (${sql.join(fightIdTokens, sql`, `)})`
                        ));

                    const recentTotal = Number(recentPicks[0]?.total || 0);
                    const recentCorrect = Number(recentPicks[0]?.correct || 0);
                    recentAccuracy = recentTotal > 0 ? (recentCorrect / recentTotal) : 0;
                }
            }

            // Calculate final competitive score (0-100 normalized)
            const finalScore = (
                (accuracyRate * 60) +
                (recentAccuracy * 25) +
                (participationRate * 15)
            );

            rankings.push({
                userId: user.id,
                username: user.username || 'Unknown',
                totalPoints: user.totalPoints,
                competitiveScore: Math.round(finalScore * 100) / 100,
                metrics: {
                    accuracy: Math.round(accuracyRate * 100),
                    recentAccuracy: Math.round(recentAccuracy * 100),
                    participation: Math.round(participationRate * 100)
                }
            });

        } catch (error) {
            logger.error(`Failed to calculate ranking metrics for user ${user.id}:`, error);
        }
    }

    // 3. Sort by competitiveScore (Skill focus)
    rankings.sort((a, b) => b.competitiveScore - a.competitiveScore);
    rankings.forEach((r, i) => r.rank = i + 1);

    const [snapshot] = await db.insert(leaderboardSnapshots)
        .values({
            id: uuidv4(),
            snapshotType: type,
            eventId: eventId || null,
            snapshotDate: new Date(),
            rankings: rankings as any,
            createdAt: new Date(),
        })
        .returning();

    return snapshot;
}
