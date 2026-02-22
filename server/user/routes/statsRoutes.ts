import type { Express, Request } from "express";

import { isAuthenticated } from '../../auth/replitAuth';
import { db } from "../../db";
import { userPicks, fightResults } from "../../../shared/models/auth";
import { events, eventFights } from "../../../shared/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { calculateProfit } from "../../roiCalculator";
import { logger } from '../../utils/logger';

export function registerStatsRoutes(app: Express): void {
    // GET /api/me/stats — aggregated user pick statistics
    app.get("/api/me/stats", isAuthenticated, async (req: Request, res) => {
        try {
            const userId = req.user.id;

            // Get all user picks
            const allPicks = await db
                .select()
                .from(userPicks)
                .where(and(eq(userPicks.userId, userId), eq(userPicks.status, 'active')))
                .orderBy(desc(userPicks.createdAt));

            if (allPicks.length === 0) {
                return res.json({
                    totalPicks: 0,
                    wins: 0,
                    losses: 0,
                    pending: 0,
                    accuracy: 0,
                    totalUnits: 0,
                    totalProfit: 0,
                    roi: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                    picks: [],
                    perEventStats: [],
                });
            }

            // Get all fight IDs from picks
            const fightIds = [...new Set(allPicks.map(p => p.fightId))];

            // Get fight details (for odds and event mapping)
            const fights = fightIds.length > 0
                ? await db.select().from(eventFights).where(inArray(eventFights.id, fightIds))
                : [];

            // Get fight results
            const results = fightIds.length > 0
                ? await db.select().from(fightResults).where(inArray(fightResults.fightId, fightIds))
                : [];

            // Get event details for fight-to-event mapping
            const eventIds = [...new Set(fights.map(f => f.eventId))];
            const eventDataArr = eventIds.length > 0
                ? await db.select().from(events).where(inArray(events.id, eventIds))
                : [];

            // Build lookup maps
            const fightMap = new Map(fights.map(f => [f.id, f]));
            const resultMap = new Map(results.map(r => [r.fightId, r]));
            const eventMap = new Map(eventDataArr.map(e => [e.id, e]));

            let wins = 0;
            let losses = 0;
            let pending = 0;
            let totalProfit = 0;
            let currentStreak = 0;
            let bestStreak = 0;
            let streakActive = true;

            // Per-event aggregation
            const perEventAcc: Record<string, {
                eventId: string; eventName: string; eventDate: string;
                picks: number; wins: number; profit: number;
            }> = {};

            const enrichedPicks = allPicks.map(pick => {
                const fight = fightMap.get(pick.fightId);
                const result = resultMap.get(pick.fightId);
                const event = fight ? eventMap.get(fight.eventId) : undefined;

                let status: 'win' | 'loss' | 'pending' = 'pending';
                let profit = 0;

                if (result && result.winnerId) {
                    // Draw/No Contest = refund (0 profit, not a win or loss)
                    if (result.winnerId === 'draw' || result.winnerId === 'no_contest') {
                        // Not counted as win or loss, units refunded (0 profit)
                        pending++; // Effectively neutral — not decided
                    } else {
                        // Fight has a decisive result
                        const isWin = pick.pickedFighterId === result.winnerId;

                        if (isWin) {
                            status = 'win';
                            wins++;
                            // Calculate profit from odds using actual units
                            const pickUnits = pick.units || 1;
                            const odds = fight?.odds as { fighter1Odds?: string; fighter2Odds?: string } | null;
                            const pickedOdds = pick.pickedFighterId === fight?.fighter1Id
                                ? odds?.fighter1Odds
                                : odds?.fighter2Odds;

                            profit = pickedOdds ? calculateProfit(pickedOdds, pickUnits) : pickUnits; // Default +units on win if no odds

                            if (streakActive) currentStreak++;
                            bestStreak = Math.max(bestStreak, currentStreak);
                        } else {
                            status = 'loss';
                            losses++;
                            const lossUnits = pick.units || 1;
                            profit = -lossUnits; // Lost wagered units
                            streakActive = false;
                            currentStreak = 0;
                        }

                        totalProfit += profit;
                    }
                } else {
                    pending++;
                }

                // Per-event aggregation
                if (event) {
                    if (!perEventAcc[event.id]) {
                        perEventAcc[event.id] = {
                            eventId: event.id,
                            eventName: event.name,
                            eventDate: String(event.date),
                            picks: 0, wins: 0, profit: 0,
                        };
                    }
                    perEventAcc[event.id].picks++;
                    if (status === 'win') perEventAcc[event.id].wins++;
                    perEventAcc[event.id].profit += profit;
                }

                return {
                    id: pick.id,
                    fightId: pick.fightId,
                    pickedFighterId: pick.pickedFighterId,
                    pickedMethod: pick.pickedMethod,
                    pickedRound: pick.pickedRound,
                    pointsAwarded: pick.pointsAwarded,
                    status,
                    profit: Math.round(profit * 100) / 100,
                    eventName: event?.name || 'Unknown Event',
                    eventDate: event?.date || '',
                    createdAt: pick.createdAt,
                };
            });

            const decided = wins + losses;
            const totalUnits = allPicks.reduce((sum, p) => sum + (p.units || 1), 0);
            const accuracy = decided > 0 ? Math.round((wins / decided) * 100) : 0;
            const roi = totalUnits > 0 ? Math.round((totalProfit / totalUnits) * 10000) / 100 : 0;

            const perEventStats = Object.values(perEventAcc)
                .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

            res.json({
                totalPicks: allPicks.length,
                wins,
                losses,
                pending,
                accuracy,
                totalUnits,
                totalProfit: Math.round(totalProfit * 100) / 100,
                roi,
                currentStreak,
                bestStreak,
                picks: enrichedPicks.slice(0, 50), // Last 50 picks
                perEventStats,
            });
        } catch (error) {
            logger.error("Error fetching user stats:", error);
            res.status(500).json({ message: "Failed to fetch stats" });
        }
    });
}
