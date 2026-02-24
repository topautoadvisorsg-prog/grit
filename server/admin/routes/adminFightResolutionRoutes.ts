import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { finalizeFightResult } from '../../services/scoringService';
import { logger } from '../../utils/logger';

/**
 * Admin-only route for finalizing fight results.
 * Protected by isAuthenticated + requireAdmin middleware.
 * Business logic is delegated to scoringService.
 */
export function registerAdminFightResolutionRoutes(app: Express): void {

    // Admin: Finalize a fight result
    app.post("/api/fights/:fightId/result", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { fightId } = req.params;
            const resultData = req.body;

            const result = await finalizeFightResult(fightId, resultData);

            res.json({
                message: "Fight result saved successfully",
                result,
            });
        } catch (error: any) {
            if (error.message === 'FIGHT_NOT_FOUND') {
                return res.status(404).json({ message: "Fight not found" });
            }
            logger.error("Error saving fight result:", error);
            res.status(500).json({ message: "Failed to save fight result" });
        }
    });
}
