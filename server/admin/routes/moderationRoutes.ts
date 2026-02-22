import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { db } from "../../db";
import { userBlocks, userMutes, userReports } from "../../../shared/models/auth";
import { eq, and, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { reportUserSchema, muteUserSchema } from '../../schemas';

export function registerModerationRoutes(app: Express) {

    // ========== BLOCK ENDPOINTS ==========

    // Block a user (server-enforced)
    app.post("/api/users/:id/block", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const blockerId = req.user.id;
            const blockedId = req.params.id;

            if (blockerId === blockedId) {
                return res.status(400).json({ message: "Cannot block yourself" });
            }

            // Check if already blocked
            const [existing] = await db.select()
                .from(userBlocks)
                .where(and(
                    eq(userBlocks.blockerId, blockerId),
                    eq(userBlocks.blockedId, blockedId)
                ));

            if (existing) {
                return res.status(400).json({ message: "User already blocked" });
            }

            const [block] = await db.insert(userBlocks)
                .values({
                    id: uuidv4(),
                    blockerId,
                    blockedId,
                    createdAt: new Date(),
                })
                .returning();

            res.status(201).json(block);
        } catch (error) {
            logger.error("Error blocking user:", error);
            res.status(500).json({ message: "Failed to block user" });
        }
    });

    // Unblock a user
    app.delete("/api/users/:id/block", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const blockerId = req.user.id;
            const blockedId = req.params.id;

            await db.delete(userBlocks)
                .where(and(
                    eq(userBlocks.blockerId, blockerId),
                    eq(userBlocks.blockedId, blockedId)
                ));

            res.json({ success: true });
        } catch (error) {
            logger.error("Error unblocking user:", error);
            res.status(500).json({ message: "Failed to unblock user" });
        }
    });

    // Get blocked users
    app.get("/api/me/blocks", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;

            const blocks = await db.select()
                .from(userBlocks)
                .where(eq(userBlocks.blockerId, userId));

            res.json(blocks);
        } catch (error) {
            logger.error("Error fetching blocks:", error);
            res.status(500).json({ message: "Failed to fetch blocks" });
        }
    });

    // ========== MUTE ENDPOINTS ==========

    // Mute a user (soft suppression)
    app.post("/api/users/:id/mute", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const muterId = req.user.id;
            const mutedId = req.params.id;
            const { duration } = req.body; // Optional: duration in hours

            if (muterId === mutedId) {
                return res.status(400).json({ message: "Cannot mute yourself" });
            }

            // Check if already muted
            const [existing] = await db.select()
                .from(userMutes)
                .where(and(
                    eq(userMutes.muterId, muterId),
                    eq(userMutes.mutedId, mutedId)
                ));

            if (existing) {
                return res.status(400).json({ message: "User already muted" });
            }

            let expiresAt = null;
            if (duration) {
                expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
            }

            const [mute] = await db.insert(userMutes)
                .values({
                    id: uuidv4(),
                    muterId,
                    mutedId,
                    expiresAt,
                    createdAt: new Date(),
                })
                .returning();

            res.status(201).json(mute);
        } catch (error) {
            logger.error("Error muting user:", error);
            res.status(500).json({ message: "Failed to mute user" });
        }
    });

    // Unmute a user
    app.delete("/api/users/:id/mute", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const muterId = req.user.id;
            const mutedId = req.params.id;

            await db.delete(userMutes)
                .where(and(
                    eq(userMutes.muterId, muterId),
                    eq(userMutes.mutedId, mutedId)
                ));

            res.json({ success: true });
        } catch (error) {
            logger.error("Error unmuting user:", error);
            res.status(500).json({ message: "Failed to unmute user" });
        }
    });

    // Get muted users
    app.get("/api/me/mutes", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;

            const mutes = await db.select()
                .from(userMutes)
                .where(eq(userMutes.muterId, userId));

            res.json(mutes);
        } catch (error) {
            logger.error("Error fetching mutes:", error);
            res.status(500).json({ message: "Failed to fetch mutes" });
        }
    });

    // ========== REPORT ENDPOINTS ==========

    // Report a user
    app.post("/api/users/:id/report", isAuthenticated, validate(reportUserSchema), async (req: Request, res: Response) => {
        try {
            const reporterId = req.user.id;
            const reportedId = req.params.id;
            const { reason, details } = req.body;

            if (reporterId === reportedId) {
                return res.status(400).json({ message: "Cannot report yourself" });
            }

            if (!reason || reason.trim().length === 0) {
                return res.status(400).json({ message: "Reason is required" });
            }

            const [report] = await db.insert(userReports)
                .values({
                    id: uuidv4(),
                    reporterId,
                    reportedId,
                    reason: reason.trim(),
                    details: details?.trim() || null,
                    status: "pending",
                    createdAt: new Date(),
                })
                .returning();

            res.status(201).json({ success: true, reportId: report.id });
        } catch (error) {
            logger.error("Error reporting user:", error);
            res.status(500).json({ message: "Failed to report user" });
        }
    });

    // ========== ADMIN ENDPOINTS ==========

    // Get all pending reports (admin only)
    app.get("/api/admin/reports", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { status = "pending" } = req.query;

            const reports = await db.select()
                .from(userReports)
                .where(eq(userReports.status, status as string));

            res.json(reports);
        } catch (error) {
            logger.error("Error fetching reports:", error);
            res.status(500).json({ message: "Failed to fetch reports" });
        }
    });

    // Update report status (admin only)
    app.patch("/api/admin/reports/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status, adminNotes } = req.body;

            const [updated] = await db.update(userReports)
                .set({
                    status,
                    adminNotes,
                    resolvedBy: req.user.id,
                    resolvedAt: new Date(),
                })
                .where(eq(userReports.id, id))
                .returning();

            if (!updated) {
                return res.status(404).json({ message: "Report not found" });
            }

            res.json(updated);
        } catch (error) {
            logger.error("Error updating report:", error);
            res.status(500).json({ message: "Failed to update report" });
        }
    });

    // ========== HELPER: Get blocked user IDs for filtering ==========
    // This is used by other routes (e.g., chat) to filter blocked users
}

// Helper function to get blocked user IDs for a user
export async function getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await db.select({ blockedId: userBlocks.blockedId })
        .from(userBlocks)
        .where(eq(userBlocks.blockerId, userId));

    return blocks.map(b => b.blockedId);
}

// Helper function to check if user is blocked
export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [block] = await db.select()
        .from(userBlocks)
        .where(or(
            and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)),
            and(eq(userBlocks.blockerId, blockedId), eq(userBlocks.blockedId, blockerId))
        ));

    return !!block;
}
