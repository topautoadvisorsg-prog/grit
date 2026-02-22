import type { Express, Request } from "express";

import { isAuthenticated } from '../../auth/replitAuth';
import { db } from "../../db";
import {
  users,
  userPicks,
  fightResults,
  eventFights,
  events,
  fighters,
  fightHistory,
  insertFightResultSchema
} from "../../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { logger } from '../../utils/logger';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// Calculate points for a pick based on fight result
// Scoring: Fighter correct (1pt) + Method correct (2pts) + Round correct (3pts) = max 6 points
// Decision picks auto-award 3pts for round when fighter and method are correct
// Draw/No Contest: No points awarded to any pick (no winner to match)
function calculatePoints(
  pick: { pickedFighterId: string; pickedMethod: string; pickedRound: number | null },
  result: { winnerId: string | null; method: string | null; round: number | null }
): number {
  // Handle Draw/No Contest - no points for anyone
  if (!result.winnerId || result.winnerId === 'draw' || result.winnerId === 'no_contest') {
    logger.debug(`[Fight Result] Draw/No Contest - no points awarded`);
    return 0;
  }

  let points = 0;

  // Fighter correct: 1 point
  if (pick.pickedFighterId === result.winnerId) {
    points += 1;
  } else {
    return 0; // If fighter is wrong, no points at all
  }

  // Method correct: 2 points
  const normalizedPickMethod = normalizeMethod(pick.pickedMethod);
  const normalizedResultMethod = normalizeMethod(result.method || '');

  logger.debug(`[Fight Result] Method comparison: picked="${normalizedPickMethod}" vs result="${normalizedResultMethod}"`);

  if (normalizedPickMethod === normalizedResultMethod) {
    points += 2;

    // Round points: 3 points
    // For decisions: auto-award 3pts when fighter and method are correct (no round prediction needed)
    // For finishes (KO/TKO, Submission): only award if round matches
    if (normalizedPickMethod === 'decision') {
      // Decisions auto-award round points when fighter + method correct
      points += 3;
    } else if (pick.pickedRound === result.round) {
      // Finishes require matching round
      points += 3;
    }
  }

  return points;
}

// Normalize method names for comparison
function normalizeMethod(method: string): string {
  const lower = method.toLowerCase();
  if (lower.includes('ko') || lower.includes('tko')) return 'ko/tko';
  if (lower.includes('sub')) return 'submission';
  if (lower.includes('dec') || lower.includes('unanimous') || lower.includes('split') || lower.includes('majority')) return 'decision';
  return lower;
}

export function registerFightResultsRoutes(app: Express): void {
  // Admin: Finalize a fight result
  app.post("/api/fights/:fightId/result", isAuthenticated, async (req: Request, res) => {
    try {
      const currentUserId = req.user.id;
      const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId));

      if (!currentUser || (currentUser.role !== "admin" && currentUser.email !== ADMIN_EMAIL)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { fightId } = req.params;
      const resultData = req.body;

      // Run entire result processing in a transaction
      const result = await db.transaction(async (tx) => {

        // Validate the fight exists
        const [fight] = await tx
          .select()
          .from(eventFights)
          .where(eq(eventFights.id, fightId));

        if (!fight) {
          throw new Error('FIGHT_NOT_FOUND');
        }

        // Create or update fight result
        const [existingResult] = await tx
          .select()
          .from(fightResults)
          .where(eq(fightResults.fightId, fightId));

        let fightResult;
        if (existingResult) {
          [fightResult] = await tx
            .update(fightResults)
            .set({
              ...resultData,
              fightId,
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(fightResults.id, existingResult.id))
            .returning();
        } else {
          [fightResult] = await tx
            .insert(fightResults)
            .values({
              ...resultData,
              fightId,
              completedAt: new Date(),
            })
            .returning();
        }

        // Update event_fights status
        await tx
          .update(eventFights)
          .set({ status: 'Completed' })
          .where(eq(eventFights.id, fightId));

        // Calculate and update points for all picks on this fight
        const picks = await tx
          .select()
          .from(userPicks)
          .where(eq(userPicks.fightId, fightId));

        logger.debug(`[Fight Result] Processing ${picks.length} picks for fight ${fightId}`);
        logger.debug(`[Fight Result] Fight result: winnerId=${fightResult.winnerId}, method=${fightResult.method}, round=${fightResult.round}`);

        for (const pick of picks) {
          logger.debug(`[Fight Result] Pick: userId=${pick.userId}, pickedFighterId=${pick.pickedFighterId}, method=${pick.pickedMethod}, round=${pick.pickedRound}`);

          const points = calculatePoints(
            {
              pickedFighterId: pick.pickedFighterId,
              pickedMethod: pick.pickedMethod,
              pickedRound: pick.pickedRound,
            },
            {
              winnerId: fightResult.winnerId,
              method: fightResult.method,
              round: fightResult.round,
            }
          );

          logger.debug(`[Fight Result] Calculated points: ${points} for user ${pick.userId}`);

          // Update pick with points
          await tx
            .update(userPicks)
            .set({
              pointsAwarded: points,
              isLocked: true,
              updatedAt: new Date(),
            })
            .where(eq(userPicks.id, pick.id));

          logger.debug(`[Fight Result] Updated pick ${pick.id} with ${points} points`);
        }

        // Recalculate total points for all affected users
        const affectedUserIds = [...new Set(picks.map(p => p.userId))];
        for (const userId of affectedUserIds) {
          const userPicksResult = await tx
            .select({ totalPoints: sql<number>`COALESCE(SUM(${userPicks.pointsAwarded}), 0)` })
            .from(userPicks)
            .where(eq(userPicks.userId, userId));

          const totalPoints = Number(userPicksResult[0]?.totalPoints || 0);

          await tx
            .update(users)
            .set({ totalPoints, updatedAt: new Date() })
            .where(eq(users.id, userId));
        }

        // Get event data for fight history
        const [eventData] = await tx.select().from(events).where(eq(events.id, fight.eventId));

        // Get both fighters
        const [fighter1Data] = await tx.select().from(fighters).where(eq(fighters.id, fight.fighter1Id));
        const [fighter2Data] = await tx.select().from(fighters).where(eq(fighters.id, fight.fighter2Id));

        const isDrawOrNC = !fightResult.winnerId || fightResult.winnerId === 'draw' || fightResult.winnerId === 'no_contest';
        const method = normalizeMethod(fightResult.method || '');
        const now = new Date();
        const loserId = !isDrawOrNC ? (fightResult.winnerId === fight.fighter1Id ? fight.fighter2Id : fight.fighter1Id) : null;

        // Determine results for each fighter
        let fighter1Result: string;
        let fighter2Result: string;
        if (isDrawOrNC) {
          fighter1Result = fightResult.winnerId === 'draw' ? 'DRAW' : 'NC';
          fighter2Result = fighter1Result;
        } else {
          fighter1Result = fightResult.winnerId === fight.fighter1Id ? 'WIN' : 'LOSS';
          fighter2Result = fightResult.winnerId === fight.fighter2Id ? 'WIN' : 'LOSS';
        }

        // Update eventFights with result details
        await tx.update(eventFights).set({
          method: fightResult.method,
          roundEnd: fightResult.round,
          timeEnd: fightResult.time,
          referee: fightResult.referee,
          winnerId: isDrawOrNC ? null : fightResult.winnerId,
          fighter1Result,
          fighter2Result,
        }).where(eq(eventFights.id, fightId));

        // Create fight history records for BOTH fighters
        const baseFightData = {
          eventId: fight.eventId,
          eventName: eventData?.name || 'Unknown Event',
          eventDate: eventData?.date || now,
          eventPromotion: eventData?.organization || 'UFC',
          weightClass: fight.weightClass,
          fightType: fight.cardPlacement || 'Main Card',
          billing: fight.cardPlacement,
          boutOrder: fight.boutOrder,
          roundsScheduled: fight.rounds,
          location: { city: eventData?.city || '', country: eventData?.country || '', venue: eventData?.venue || '' },
          method: fightResult.method || '',
          methodDetail: fightResult.methodDetail || '',
          round: fightResult.round || 1,
          time: fightResult.time || '0:00',
          fightDurationSeconds: 0,
          titleFight: fight.isTitleFight || false,
          referee: fightResult.referee || '',
          isLocked: true,
          stats: (fightResult as any).stats?.fighter1Stats || null,
        };

        // Fighter 1 fight history
        const fighter1FightId = `fh-${fightId}-${fight.fighter1Id}`;
        const existingFH1 = await tx.select().from(fightHistory).where(eq(fightHistory.id, fighter1FightId));
        if (existingFH1.length === 0) {
          await tx.insert(fightHistory).values({
            id: fighter1FightId,
            fighterId: fight.fighter1Id,
            fighterName: fighter1Data ? `${fighter1Data.firstName} ${fighter1Data.lastName}` : '',
            fighterNickname: fighter1Data?.nickname || '',
            opponentId: fight.fighter2Id,
            opponentName: fighter2Data ? `${fighter2Data.firstName} ${fighter2Data.lastName}` : '',
            opponentNickname: fighter2Data?.nickname || '',
            result: fighter1Result,
            ...baseFightData,
            stats: (fightResult as any).stats?.fighter1Stats || null,
          });
        }

        // Fighter 2 fight history
        const fighter2FightId = `fh-${fightId}-${fight.fighter2Id}`;
        const existingFH2 = await tx.select().from(fightHistory).where(eq(fightHistory.id, fighter2FightId));
        if (existingFH2.length === 0) {
          await tx.insert(fightHistory).values({
            id: fighter2FightId,
            fighterId: fight.fighter2Id,
            fighterName: fighter2Data ? `${fighter2Data.firstName} ${fighter2Data.lastName}` : '',
            fighterNickname: fighter2Data?.nickname || '',
            opponentId: fight.fighter1Id,
            opponentName: fighter1Data ? `${fighter1Data.firstName} ${fighter1Data.lastName}` : '',
            opponentNickname: fighter1Data?.nickname || '',
            result: fighter2Result,
            ...baseFightData,
            stats: (fightResult as any).stats?.fighter2Stats || null,
          });
        }

        logger.debug(`[Fight Result] Created fight history records for both fighters`);

        // Update fighter records AND performance stats
        if (!isDrawOrNC && fightResult.winnerId) {
          const [winner] = await tx.select().from(fighters).where(eq(fighters.id, fightResult.winnerId));
          const [loser] = loserId ? await tx.select().from(fighters).where(eq(fighters.id, loserId)) : [null];

          logger.debug(`[Fight Result] Updating fighter records: winner=${fightResult.winnerId}, loser=${loserId}`);

          if (winner) {
            const winnerRecord = { ...(winner.record as any || { wins: 0, losses: 0, draws: 0, noContests: 0 }) };
            winnerRecord.wins = (winnerRecord.wins || 0) + 1;

            const winnerPerf = { ...(winner.performance as any || {}) };
            if (method === 'ko/tko') {
              winnerPerf.ko_wins = (winnerPerf.ko_wins || 0) + 1;
            } else if (method === 'submission') {
              winnerPerf.submission_wins = (winnerPerf.submission_wins || 0) + 1;
            } else if (method === 'decision') {
              winnerPerf.decision_wins = (winnerPerf.decision_wins || 0) + 1;
            }
            winnerPerf.win_streak = (winnerPerf.win_streak || 0) + 1;
            winnerPerf.loss_streak = 0;
            if ((winnerPerf.win_streak || 0) > (winnerPerf.longest_win_streak || 0)) {
              winnerPerf.longest_win_streak = winnerPerf.win_streak;
            }

            await tx.update(fighters).set({
              record: winnerRecord,
              performance: winnerPerf,
              wins: (winner.wins || 0) + 1,
              lastUpdated: now
            }).where(eq(fighters.id, fightResult.winnerId));
          }

          if (loser && loserId) {
            const loserRecord = { ...(loser.record as any || { wins: 0, losses: 0, draws: 0, noContests: 0 }) };
            loserRecord.losses = (loserRecord.losses || 0) + 1;

            const loserPerf = { ...(loser.performance as any || {}) };
            if (method === 'ko/tko') {
              loserPerf.losses_by_ko = (loserPerf.losses_by_ko || 0) + 1;
            } else if (method === 'submission') {
              loserPerf.losses_by_submission = (loserPerf.losses_by_submission || 0) + 1;
            } else if (method === 'decision') {
              loserPerf.losses_by_decision = (loserPerf.losses_by_decision || 0) + 1;
            }
            loserPerf.loss_streak = (loserPerf.loss_streak || 0) + 1;
            loserPerf.win_streak = 0;

            await tx.update(fighters).set({
              record: loserRecord,
              performance: loserPerf,
              losses: (loser.losses || 0) + 1,
              lastUpdated: now
            }).where(eq(fighters.id, loserId));
          }
        } else if (fightResult.winnerId === 'draw') {
          logger.debug(`[Fight Result] Draw - updating both fighters with draw record`);

          if (fighter1Data) {
            const record = { ...(fighter1Data.record as any || { wins: 0, losses: 0, draws: 0, noContests: 0 }) };
            record.draws = (record.draws || 0) + 1;
            await tx.update(fighters).set({
              record,
              draws: (fighter1Data.draws || 0) + 1,
              lastUpdated: now
            }).where(eq(fighters.id, fight.fighter1Id));
          }

          if (fighter2Data) {
            const record = { ...(fighter2Data.record as any || { wins: 0, losses: 0, draws: 0, noContests: 0 }) };
            record.draws = (record.draws || 0) + 1;
            await tx.update(fighters).set({
              record,
              draws: (fighter2Data.draws || 0) + 1,
              lastUpdated: now
            }).where(eq(fighters.id, fight.fighter2Id));
          }
        }

        return fightResult;

      }); // end transaction

      res.json({
        fightResult: result,
        message: "Fight result saved and points calculated",
      });
    } catch (error: any) {
      if (error?.message === 'FIGHT_NOT_FOUND') {
        return res.status(404).json({ message: "Fight not found" });
      }
      logger.error("Error saving fight result:", error);
      res.status(500).json({ message: "Failed to save fight result" });
    }
  });

  // Get fight result
  app.get("/api/fights/:fightId/result", async (req, res) => {
    try {
      const { fightId } = req.params;

      const [result] = await db
        .select()
        .from(fightResults)
        .where(eq(fightResults.fightId, fightId));

      res.json(result || null);
    } catch (error) {
      logger.error("Error fetching fight result:", error);
      res.status(500).json({ message: "Failed to fetch fight result" });
    }
  });

  // Public: Get all fight results
  app.get("/api/fights/results", async (_req, res) => {
    try {
      const results = await db.select().from(fightResults);
      res.json(results);
    } catch (error) {
      logger.error("Error fetching fight results:", error);
      res.status(500).json({ message: "Failed to fetch fight results" });
    }
  });

}
