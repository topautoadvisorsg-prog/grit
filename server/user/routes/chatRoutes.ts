import type { Express, Request, Response } from "express";

import { isAuthenticated } from '../../auth/guards';
import * as chatService from '../../services/chatService';
import { logger } from '../../utils/logger';

/**
 * Chat routes — all business logic delegated to chatService.
 */
export function registerChatRoutes(app: Express) {

    // Get chat messages with type filtering
    app.get("/api/chat", async (req: Request, res: Response) => {
        try {
            const { event_id, chat_type, country_code, limit } = req.query;

            const messages = await chatService.getMessages({
                chatType: chat_type as string,
                eventId: event_id as string,
                countryCode: country_code as string,
                limit: limit ? Number(limit) : undefined,
            });

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

            if (chatType === 'event' && !eventId) {
                return res.status(400).json({ error: "eventId required for event chat" });
            }

            const newMessage = await chatService.postMessage(userId, message, {
                chatType,
                eventId,
                countryCode,
            });

            res.status(201).json(newMessage);
        } catch (error: any) {
            if (error.message === 'NO_COUNTRY_SET') {
                return res.status(400).json({ error: "Set your country in profile settings to use country chat" });
            }
            logger.error("Error posting chat message:", error);
            res.status(500).json({ error: "Failed to post message" });
        }
    });
}
