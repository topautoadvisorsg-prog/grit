import type { Express, Request, Response } from "express";

import { isAuthenticated } from '../../auth/replitAuth';
import { db } from "../../db";
import { chatMessages } from "../../../shared/schema";
import { users } from "../../../shared/models/auth";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';

export function registerChatRoutes(app: Express) {
    // Get chat messages with type filtering
    // Supports: global, event (with event_id), country (with country_code)
    app.get("/api/chat", async (req: Request, res: Response) => {
        try {
            const { event_id, chat_type = 'global', country_code, limit = 50 } = req.query;

            let messages;

            if (chat_type === 'event' && event_id) {
                messages = await db.select()
                    .from(chatMessages)
                    .where(and(
                        eq(chatMessages.chatType, 'event'),
                        eq(chatMessages.eventId, event_id as string)
                    ))
                    .orderBy(desc(chatMessages.createdAt))
                    .limit(Number(limit));
            } else if (chat_type === 'country' && country_code) {
                messages = await db.select()
                    .from(chatMessages)
                    .where(and(
                        eq(chatMessages.chatType, 'country'),
                        eq(chatMessages.countryCode, country_code as string)
                    ))
                    .orderBy(desc(chatMessages.createdAt))
                    .limit(Number(limit));
            } else {
                // Default: global chat
                messages = await db.select()
                    .from(chatMessages)
                    .where(eq(chatMessages.chatType, 'global'))
                    .orderBy(desc(chatMessages.createdAt))
                    .limit(Number(limit));
            }

            res.json(messages);
        } catch (error) {
            logger.error("Error fetching chat messages:", error);
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    });

    // Post a new chat message
    app.post("/api/chat", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const { message, eventId, chatType, countryCode } = req.body;
            const userId = req.user.id;

            if (!message || message.trim().length === 0) {
                return res.status(400).json({ error: "Message cannot be empty" });
            }

            if (message.length > 1000) {
                return res.status(400).json({ error: "Message too long (max 1000 characters)" });
            }

            // Determine chat type
            let resolvedChatType = chatType || 'global';
            let resolvedCountryCode = null;

            if (resolvedChatType === 'event' && !eventId) {
                return res.status(400).json({ error: "eventId required for event chat" });
            }

            if (resolvedChatType === 'country') {
                // Get user's country if not provided
                if (countryCode) {
                    resolvedCountryCode = countryCode;
                } else {
                    const [user] = await db.select().from(users).where(eq(users.id, userId));
                    resolvedCountryCode = user?.country || null;

                    if (!resolvedCountryCode) {
                        return res.status(400).json({ error: "Set your country in profile settings to use country chat" });
                    }
                }
            }

            const [newMessage] = await db.insert(chatMessages)
                .values({
                    id: uuidv4(),
                    userId,
                    eventId: resolvedChatType === 'event' ? eventId : null,
                    chatType: resolvedChatType,
                    countryCode: resolvedCountryCode,
                    message: message.trim(),
                    createdAt: new Date()
                })
                .returning();

            res.status(201).json(newMessage);
        } catch (error) {
            logger.error("Error posting chat message:", error);
            res.status(500).json({ error: "Failed to post message" });
        }
    });
}
