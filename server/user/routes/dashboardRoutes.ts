import type { Express, Request } from "express";

import { isAuthenticated } from '../../auth/guards';
import { db } from "../../db";
import { users, userPicks, events, eventFights } from "../../../shared/schema";
import { leaderboardSnapshots } from "../../../shared/models/auth";
import { eq, desc, sql, and } from "drizzle-orm";
import { logger } from '../../utils/logger';

export function registerDashboardRoutes(app: Express): void {
    app.get("/api/me/dashboard", isAuthenticated, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            // Get user data
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Calculate rank
            const allUsers = await db
                .select({ id: users.id, totalPoints: users.totalPoints })
                .from(users)
                .orderBy(desc(users.totalPoints));

            const userIndex = allUsers.findIndex(u => u.id === userId);
            const rank = userIndex >= 0 ? userIndex + 1 : allUsers.length + 1;

            // Get all active user picks (exclude voided)
            const allPicks = await db
                .select()
                .from(userPicks)
                .where(and(eq(userPicks.userId, userId), eq(userPicks.status, 'active')))
                .orderBy(desc(userPicks.createdAt));

            const totalPicks = allPicks.length;
            const decidedPicks = allPicks.filter(p => p.pointsAwarded > 0 || p.isLocked);
            const wins = allPicks.filter(p => p.pointsAwarded > 0).length;
            const decided = allPicks.filter(p => {
                // A pick is "decided" if it has been scored (pointsAwarded >= 0 and locked)
                return p.isLocked;
            }).length;
            const accuracy = decided > 0 ? Math.round((wins / decided) * 100) : 0;

            // Calculate streak from recent decided picks
            let currentStreak = 0;
            const lockedPicks = allPicks.filter(p => p.isLocked);
            for (const pick of lockedPicks) {
                if (pick.pointsAwarded > 0) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            // Get upcoming event (next event with status 'Upcoming')
            const upcomingEvents = await db
                .select()
                .from(events)
                .where(eq(events.status, 'Upcoming'))
                .orderBy(events.date)
                .limit(1);

            let upcomingEvent: { id: string; name: string; date: Date; picksComplete: number; totalFights: number; } | null = null;
            if (upcomingEvents.length > 0) {
                const evt = upcomingEvents[0];
                // Count fights in event
                const eventFightsList = await db
                    .select()
                    .from(eventFights)
                    .where(eq(eventFights.eventId, evt.id));

                // Count user's picks for this event
                const fightIds = eventFightsList.map(f => f.id);
                const userPicksForEvent = fightIds.length > 0
                    ? allPicks.filter(p => fightIds.includes(p.fightId))
                    : [];

                upcomingEvent = {
                    id: evt.id,
                    name: evt.name,
                    date: evt.date,
                    picksComplete: userPicksForEvent.length,
                    totalFights: eventFightsList.length,
                };
            }

            // Badge progress (simple: based on total picks milestones)
            const badgeMilestones = [
                { threshold: 10, name: 'First Timer' },
                { threshold: 25, name: 'Regular' },
                { threshold: 50, name: 'Veteran' },
                { threshold: 100, name: 'Sharpshooter' },
                { threshold: 250, name: 'Elite Analyst' },
            ];

            let nextBadge: { name: string; progress: number; } | null = null;
            for (const milestone of badgeMilestones) {
                if (totalPicks < milestone.threshold) {
                    nextBadge = {
                        name: milestone.name,
                        progress: totalPicks / milestone.threshold,
                    };
                    break;
                }
            }

            // Calculate rank change from latest snapshot
            let rankChange = 0;
            try {
                const [latestSnapshot] = await db
                    .select()
                    .from(leaderboardSnapshots)
                    .orderBy(desc(leaderboardSnapshots.snapshotDate))
                    .limit(1);

                if (latestSnapshot?.rankings) {
                    const previousEntry = latestSnapshot.rankings.find(r => r.userId === userId);
                    if (previousEntry) {
                        rankChange = previousEntry.rank - rank; // positive = improved
                    }
                }
            } catch { /* no snapshot data yet */ }

            res.json({
                rank,
                rankChange,
                totalPoints: user.totalPoints || 0,
                currentStreak,
                streakType: 'pick' as const,
                accuracy,
                totalPicks,
                nextBadge,
                upcomingEvent,
                tier: user.tier,
                starLevel: user.starLevel,
                currentPeriodEnd: user.currentPeriodEnd,
            });
        } catch (error) {
            logger.error("Error fetching dashboard:", error);
            res.status(500).json({ message: "Failed to fetch dashboard data" });
        }
    });
}
