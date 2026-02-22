import type { Express, Request, Response } from "express";

import { isAuthenticated } from '../../auth/replitAuth';
import { db } from "../../db";
import { fighterTagDefinitions, fighterTags } from "../../../shared/schema";
import { eq, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

async function isAdmin(req: Request): Promise<boolean> {
    const { users } = await import("../../shared/schema");
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    return user?.role === "admin" || user?.email === ADMIN_EMAIL;
}

export function registerTagRoutes(app: Express) {

    // Get all tag definitions (public)
    app.get("/api/tags/definitions", async (_req, res: Response) => {
        try {
            const definitions = await db.select()
                .from(fighterTagDefinitions)
                .orderBy(asc(fighterTagDefinitions.sortOrder));
            res.json(definitions);
        } catch (error) {
            logger.error("Error fetching tag definitions:", error);
            res.status(500).json({ error: "Failed to fetch tag definitions" });
        }
    });

    // Create a tag definition (admin only)
    app.post("/api/tags/definitions", isAuthenticated, async (req: Request, res: Response) => {
        try {
            if (!(await isAdmin(req))) {
                return res.status(403).json({ error: "Admin access required" });
            }

            const { name, description, sortOrder, category } = req.body;

            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: "Tag name is required" });
            }

            const [newDef] = await db.insert(fighterTagDefinitions)
                .values({
                    id: uuidv4(),
                    name: name.trim(),
                    description: description || null,
                    category: category || 'Intangibles',
                    sortOrder: sortOrder || 0,
                    createdAt: new Date(),
                })
                .returning();

            res.status(201).json(newDef);
        } catch (error: any) {
            if (error.code === "23505") {
                return res.status(400).json({ error: "Tag with this name already exists" });
            }
            logger.error("Error creating tag definition:", error);
            res.status(500).json({ error: "Failed to create tag definition" });
        }
    });

    // Delete a tag definition (admin only)
    app.delete("/api/tags/definitions/:id", isAuthenticated, async (req: Request, res: Response) => {
        try {
            if (!(await isAdmin(req))) {
                return res.status(403).json({ error: "Admin access required" });
            }

            const { id } = req.params;

            // Delete all fighter tags using this definition first
            await db.delete(fighterTags).where(eq(fighterTags.tagDefinitionId, id));

            const result = await db.delete(fighterTagDefinitions)
                .where(eq(fighterTagDefinitions.id, id));

            res.json({ success: true });
        } catch (error) {
            logger.error("Error deleting tag definition:", error);
            res.status(500).json({ error: "Failed to delete tag definition" });
        }
    });

    // Get tags for a specific fighter (public)
    app.get("/api/fighters/:id/tags", async (req, res: Response) => {
        try {
            const { id } = req.params;

            const tags = await db.select({
                id: fighterTags.id,
                fighterId: fighterTags.fighterId,
                tagDefinitionId: fighterTags.tagDefinitionId,
                value: fighterTags.value,
                color: fighterTags.color,
                tagName: fighterTagDefinitions.name,
                tagDescription: fighterTagDefinitions.description,
                tagCategory: fighterTagDefinitions.category,
                sortOrder: fighterTagDefinitions.sortOrder,
                createdAt: fighterTags.createdAt,
                updatedAt: fighterTags.updatedAt,
            })
                .from(fighterTags)
                .innerJoin(fighterTagDefinitions, eq(fighterTags.tagDefinitionId, fighterTagDefinitions.id))
                .where(eq(fighterTags.fighterId, id))
                .orderBy(asc(fighterTagDefinitions.sortOrder));

            res.json(tags);
        } catch (error) {
            logger.error("Error fetching fighter tags:", error);
            res.status(500).json({ error: "Failed to fetch fighter tags" });
        }
    });

    // Set/update tags for a fighter (admin only)
    // Accepts array of { tagDefinitionId, value, color }
    app.post("/api/fighters/:id/tags", isAuthenticated, async (req: Request, res: Response) => {
        try {
            if (!(await isAdmin(req))) {
                return res.status(403).json({ error: "Admin access required" });
            }

            const { id: fighterId } = req.params;
            const { tags } = req.body;

            if (!Array.isArray(tags)) {
                return res.status(400).json({ error: "Tags must be an array" });
            }

            // Delete existing tags for this fighter
            await db.delete(fighterTags).where(eq(fighterTags.fighterId, fighterId));

            // Insert new tags
            if (tags.length > 0) {
                const now = new Date();
                const values = tags.map((tag: any) => ({
                    id: uuidv4(),
                    fighterId,
                    tagDefinitionId: tag.tagDefinitionId,
                    value: Math.max(1, Math.min(10, tag.value || 5)),
                    color: tag.color || '#3b82f6',
                    createdAt: now,
                    updatedAt: now,
                }));

                await db.insert(fighterTags).values(values);
            }

            // Return updated tags
            const updatedTags = await db.select({
                id: fighterTags.id,
                fighterId: fighterTags.fighterId,
                tagDefinitionId: fighterTags.tagDefinitionId,
                value: fighterTags.value,
                color: fighterTags.color,
                tagName: fighterTagDefinitions.name,
                tagDescription: fighterTagDefinitions.description,
                tagCategory: fighterTagDefinitions.category,
                sortOrder: fighterTagDefinitions.sortOrder,
            })
                .from(fighterTags)
                .innerJoin(fighterTagDefinitions, eq(fighterTags.tagDefinitionId, fighterTagDefinitions.id))
                .where(eq(fighterTags.fighterId, fighterId))
                .orderBy(asc(fighterTagDefinitions.sortOrder));

            res.json(updatedTags);
        } catch (error) {
            logger.error("Error setting fighter tags:", error);
            res.status(500).json({ error: "Failed to set fighter tags" });
        }
    });

    // Delete a specific tag from a fighter (admin only)
    app.delete("/api/fighters/:fighterId/tags/:tagId", isAuthenticated, async (req: Request, res: Response) => {
        try {
            if (!(await isAdmin(req))) {
                return res.status(403).json({ error: "Admin access required" });
            }

            const { tagId } = req.params;
            await db.delete(fighterTags).where(eq(fighterTags.id, tagId));

            res.json({ success: true });
        } catch (error) {
            logger.error("Error deleting fighter tag:", error);
            res.status(500).json({ error: "Failed to delete fighter tag" });
        }
    });
}
