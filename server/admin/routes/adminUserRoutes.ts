import type { Express, Request } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/replitAuth';
import { db } from "../../db";
import { users } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from '../../utils/logger';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export function registerAdminUserRoutes(app: Express) {
  app.get("/api/admin/users", isAuthenticated, requireAdmin, async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));

      if (!currentUser || (currentUser.role !== "admin" && currentUser.email !== ADMIN_EMAIL)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      logger.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, requireAdmin, async (req: Request, res) => {
    try {
      const currentUserId = req.user.id;
      const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId));

      if (!currentUser || (currentUser.role !== "admin" && currentUser.email !== ADMIN_EMAIL)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { role } = req.body;

      const [updatedUser] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      logger.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
}
