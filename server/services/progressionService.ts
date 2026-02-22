import { db } from "../db";
import { users, userPicks, events, eventFights } from "../../shared/schema";
import { fightResults } from "../../shared/models/auth";
import { eq, and, gte, lte, inArray, ne } from "drizzle-orm";
import { calculateProfit } from "../roiCalculator";
import { logger } from "../utils/logger";

// Badge tier progression order
const BADGE_TIERS = ['none', 'ninja', 'samurai', 'master', 'goat'] as const;
type BadgeTier = typeof BADGE_TIERS[number];

interface ProgressionResult {
    userId: string;
    participationPct: number;
    roi: number;
    oldStars: number;
    newStars: number;
    oldBadge: string;
    newBadge: string;
    reason: string;
}

/**
 * Calculate monthly star/badge progression for a single user.
 * 
 * Rules:
 * - ≥70% participation AND positive ROI → +1 star (+2 if ROI > 15%)
 * - Neutral ROI (0) → no change
 * - Negative ROI → -1 star (min 0)
 * - Max 5 stars
 * - Post-5-star: same rules but advance/regress badge tier
 *   - Tiers: none → ninja → samurai → master → goat
 *   - Regression floor is 'ninja' (never drops back to 'none' once earned)
 * 
 * Cancelled fights are excluded from the participation denominator.
 */
export async function calculateUserProgression(
    userId: string,
    monthStart: Date,
    monthEnd: Date,
): Promise<ProgressionResult> {
    // 1. Get user's current state
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error(`User ${userId} not found`);

    const oldStars = user.starLevel ?? 0;
    const oldBadge = (user.progressBadge ?? 'none') as BadgeTier;

    // 2. Get all events that closed during this period
    const closedEvents = await db.select().from(events)
        .where(and(
            eq(events.status, 'Closed'),
            gte(events.date, monthStart),
            lte(events.date, monthEnd),
        ));

    if (closedEvents.length === 0) {
        return {
            userId,
            participationPct: 0,
            roi: 0,
            oldStars,
            newStars: oldStars,
            oldBadge,
            newBadge: oldBadge,
            reason: 'No closed events in period',
        };
    }

    // 3. Get all fights from those events (excluding cancelled)
    const eventIds = closedEvents.map(e => e.id);
    const allFights = await db.select().from(eventFights)
        .where(and(
            inArray(eventFights.eventId, eventIds),
            ne(eventFights.status, 'Cancelled'),
        ));

    const totalAvailableFights = allFights.length;
    if (totalAvailableFights === 0) {
        return {
            userId,
            participationPct: 0,
            roi: 0,
            oldStars,
            newStars: oldStars,
            oldBadge,
            newBadge: oldBadge,
            reason: 'No non-cancelled fights in period',
        };
    }

    // 4. Get user's active picks for those fights
    const fightIds = allFights.map(f => f.id);
    const userPicksData = await db.select().from(userPicks)
        .where(and(
            eq(userPicks.userId, userId),
            inArray(userPicks.fightId, fightIds),
            eq(userPicks.status, 'active'),
        ));

    const participationPct = Math.round((userPicksData.length / totalAvailableFights) * 100);

    // 5. Calculate ROI
    const fightMap = new Map(allFights.map(f => [f.id, f]));
    let totalUnits = 0;
    let totalProfit = 0;

    // Get fight results for scored fights
    const resultsData = fightIds.length > 0
        ? await db.select().from(fightResults).where(inArray(fightResults.fightId, fightIds))
        : [];
    const resultMap = new Map(resultsData.map(r => [r.fightId, r]));

    for (const pick of userPicksData) {
        const units = pick.units || 1;
        totalUnits += units;

        const result = resultMap.get(pick.fightId);
        if (!result || !result.winnerId) continue;

        // Draw/NC = refund (0 profit)
        if (result.winnerId === 'draw' || result.winnerId === 'no_contest') {
            continue;
        }

        const isWin = pick.pickedFighterId === result.winnerId;
        const fight = fightMap.get(pick.fightId);
        const odds = fight?.odds as { fighter1Odds?: string; fighter2Odds?: string } | null;
        const pickedOdds = pick.pickedFighterId === fight?.fighter1Id
            ? odds?.fighter1Odds
            : odds?.fighter2Odds;

        if (isWin) {
            totalProfit += pickedOdds ? calculateProfit(pickedOdds, units) : units;
        } else {
            totalProfit -= units;
        }
    }

    const roi = totalUnits > 0 ? Math.round((totalProfit / totalUnits) * 10000) / 100 : 0;

    // 6. Apply progression rules
    let newStars = oldStars;
    let newBadge = oldBadge;
    let reason = '';

    if (roi === 0) {
        // Neutral ROI → no change
        reason = `Neutral ROI (${participationPct}% participation). No change.`;
    } else if (roi > 0 && participationPct >= 70) {
        // Positive ROI + sufficient participation → advance
        const starGain = roi > 15 ? 2 : 1;

        if (oldStars < 5) {
            newStars = Math.min(5, oldStars + starGain);
            reason = `+${newStars - oldStars} star(s): ${participationPct}% participation, ${roi}% ROI`;
        } else {
            // Already at 5 stars → advance badge
            const currentIdx = BADGE_TIERS.indexOf(oldBadge);
            const newIdx = Math.min(BADGE_TIERS.length - 1, currentIdx + 1);
            newBadge = BADGE_TIERS[newIdx];
            reason = `Badge: ${oldBadge} → ${newBadge} (${participationPct}% participation, ${roi}% ROI)`;
        }
    } else if (roi < 0) {
        // Negative ROI → regress
        if (oldStars < 5 || (oldStars === 5 && BADGE_TIERS.indexOf(oldBadge) <= 1)) {
            // Still in star phase or at ninja badge → reduce stars
            newStars = Math.max(0, oldStars - 1);
            reason = `-1 star: negative ROI (${roi}%). Stars: ${oldStars} → ${newStars}`;
        } else {
            // In badge phase → regress badge (floor: ninja)
            const currentIdx = BADGE_TIERS.indexOf(oldBadge);
            const newIdx = Math.max(1, currentIdx - 1); // Floor at 'ninja' (index 1)
            newBadge = BADGE_TIERS[newIdx];
            reason = `Badge regression: ${oldBadge} → ${newBadge} (${roi}% ROI)`;
        }
    } else {
        // Positive ROI but below 70% participation
        reason = `Insufficient participation (${participationPct}%). Need ≥70%. No change.`;
    }

    // 6.b Login Bonus (Gamification)
    // Max 8 logins = 0.25 stars (1/4 star)
    // We assume the caller handles incrementing monthlyLoginCount elsewhere (e.g., on login).
    // Here we just apply the bonus based on the count stored in user ref.
    const loginBonus = Math.min(0.25, (user.monthlyLoginCount || 0) * (0.25 / 8));

    if (loginBonus > 0) {
        // Bonus is additive but capped at 5 stars total
        const potentialStars = newStars + loginBonus;
        // If they were NOT at 5 stars, add the bonus (cap at 5)
        if (oldStars < 5) {
            newStars = Math.min(5, potentialStars);
            reason += ` +${loginBonus.toFixed(2)} login bonus.`;
        }
    }

    // 7. Persist changes
    await db.update(users)
        .set({
            starLevel: newStars,
            progressBadge: newBadge,
            lastProgressionCalc: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    return {
        userId,
        participationPct,
        roi,
        oldStars,
        newStars,
        oldBadge,
        newBadge,
        reason,
    };
}

/**
 * Run monthly progression for ALL users who have made picks.
 */
export async function runMonthlyProgression(
    monthStart: Date,
    monthEnd: Date,
): Promise<ProgressionResult[]> {
    // Get all users who have made picks
    const allUsers = await db.select({ id: users.id }).from(users);
    const results: ProgressionResult[] = [];

    for (const user of allUsers) {
        try {
            const result = await calculateUserProgression(user.id, monthStart, monthEnd);
            results.push(result);
        } catch (error) {
            logger.error(`Progression calculation failed for user ${user.id}:`, error);
        }
    }

    return results;
}
