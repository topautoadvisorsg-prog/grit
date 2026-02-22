import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { db } from "../../db";
import { users, adminAuditLogs, systemSettings } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { changeRoleSchema } from '../../schemas';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// Helper to log admin actions
const logAdminAction = async (adminId: string, action: string, targetType: string, targetId: string, details: any, req: Request) => {
    try {
        await db.insert(adminAuditLogs).values({
            adminId,
            action,
            targetType,
            targetId,
            details: JSON.stringify(details),
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
        });
    } catch (error) {
        logger.error("Failed to log admin action:", error);
    }
};

export function registerAdminRoutes(app: Express): void {

    // Get Audit Logs
    app.get("/api/admin/audit-logs", isAuthenticated, requireAdmin, async (req: Request, res) => {
        try {
            // limit to 100 for now
            const logs = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(100);

            // Fetch admin names for the logs
            const adminIds = [...new Set(logs.map(l => l.adminId))];
            const admins = await db.select({ id: users.id, username: users.username, email: users.email }).from(users).where(eq(users.id, adminIds[0])); // simple fetch, optimize later if needed
            // Ideally use 'inArray' but for now simple mapping

            const enrichedLogs = await Promise.all(logs.map(async (log) => {
                const [admin] = await db.select({ username: users.username }).from(users).where(eq(users.id, log.adminId));
                return { ...log, adminUsername: admin?.username || 'Unknown' };
            }));

            res.json(enrichedLogs);
        } catch (error) {
            logger.error("Error fetching audit logs:", error);
            res.status(500).json({ message: "Failed to fetch logs" });
        }
    });

    // Ban/Unban User
    app.post("/api/admin/users/:id/ban", isAuthenticated, requireAdmin, async (req: Request, res) => {
        try {
            const { id } = req.params;
            const { ban } = req.body; // true = ban, false = unban
            const reason = req.body.reason || "No reason provided";

            const [updatedUser] = await db
                .update(users)
                .set({ isActive: !ban }) // isActive=false means banned
                .where(eq(users.id, id))
                .returning();

            await logAdminAction(req.user.id, ban ? "BAN_USER" : "UNBAN_USER", "USER", id, { reason }, req);

            res.json(updatedUser);
        } catch (error) {
            logger.error("Error banning user:", error);
            res.status(500).json({ message: "Failed to update ban status" });
        }
    });

    // Change Role
    app.post("/api/admin/users/:id/role", isAuthenticated, requireAdmin, validate(changeRoleSchema), async (req: Request, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;

            const [existingUser] = await db.select().from(users).where(eq(users.id, id));
            const oldRole = existingUser?.role;

            const [updatedUser] = await db
                .update(users)
                .set({ role })
                .where(eq(users.id, id))
                .returning();

            await logAdminAction(req.user.id, "CHANGE_ROLE", "USER", id, { oldRole, newRole: role }, req);

            res.json(updatedUser);
        } catch (error) {
            logger.error("Error changing role:", error);
            res.status(500).json({ message: "Failed to update role" });
        }
    });

    // Toggle AI Access
    app.post("/api/admin/users/:id/ai-access", isAuthenticated, requireAdmin, async (req: Request, res) => {
        try {
            const { id } = req.params;
            const { enabled } = req.body;

            const [user] = await db.select().from(users).where(eq(users.id, id));
            const currentPrefs = user?.aiPreferences || { enabled: true };

            const newPrefs = { ...currentPrefs, enabled };

            const [updatedUser] = await db
                .update(users)
                .set({ aiPreferences: newPrefs })
                .where(eq(users.id, id))
                .returning();

            await logAdminAction(req.user.id, "UPDATE_AI_ACCESS", "USER", id, { enabled }, req);

            res.json(updatedUser);
        } catch (error) {
            logger.error("Error updating AI access:", error);
            res.status(500).json({ message: "Failed to update AI access" });
        }
    });

    // System Settings
    app.get("/api/admin/settings", isAuthenticated, requireAdmin, async (req: Request, res) => {
        try {
            const settings = await db.select().from(systemSettings);
            res.json(settings);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch settings" });
        }
    });

    app.put("/api/admin/settings", isAuthenticated, requireAdmin, async (req: Request, res) => {
        try {
            const { key, value, description } = req.body;

            await db.insert(systemSettings)
                .values({ key, value, description, updatedBy: req.user.id })
                .onConflictDoUpdate({
                    target: systemSettings.key,
                    set: { value, description, updatedBy: req.user.id, updatedAt: new Date() }
                });

            await logAdminAction(req.user.id, "UPDATE_SYSTEM_SETTING", "SYSTEM", key, { value }, req);

            res.json({ success: true });
        } catch (error) {
            logger.error("Error updating system settings:", error);
            res.status(500).json({ message: "Failed to update settings" });
        }
    });
}
