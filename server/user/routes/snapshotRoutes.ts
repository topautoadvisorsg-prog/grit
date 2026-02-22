import type { Express, Request, Response } from "express";

import { db } from "../../db";
import { leaderboardSnapshots } from "../../../shared/models/auth";
import { eq, desc } from "drizzle-orm";
import { logger } from '../../utils/logger';

export function registerSnapshotRoutes(app: Express) {

    app.get("/api/leaderboard/history", async (req: Request, res: Response) => {
        try {
            const { type, limit = 10 } = req.query;
            const limitNum = Number(limit) || 10;

            let snapshots;
            if (type && typeof type === 'string') {
                snapshots = await db.select()
                    .from(leaderboardSnapshots)
                    .where(eq(leaderboardSnapshots.snapshotType, type))
                    .orderBy(desc(leaderboardSnapshots.snapshotDate))
                    .limit(limitNum);
            } else {
                snapshots = await db.select()
                    .from(leaderboardSnapshots)
                    .orderBy(desc(leaderboardSnapshots.snapshotDate))
                    .limit(limitNum);
            }

            res.json(snapshots);
        } catch (error) {
            logger.error("Error fetching leaderboard history:", error);
            res.status(500).json({ message: "Failed to fetch history" });
        }
    });

    app.get("/api/leaderboard/event/:eventId", async (req: Request, res: Response) => {
        try {
            const eventId = req.params.eventId as string;

            const [snapshot] = await db.select()
                .from(leaderboardSnapshots)
                .where(eq(leaderboardSnapshots.eventId, eventId));

            if (!snapshot) {
                return res.status(404).json({ message: "No snapshot found for this event" });
            }

            res.json(snapshot);
        } catch (error) {
            logger.error("Error fetching event snapshot:", error);
            res.status(500).json({ message: "Failed to fetch event snapshot" });
        }
    });
}

