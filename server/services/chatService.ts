import { db } from "../db";
import { chatMessages } from "../../shared/schema";
import { users } from "../../shared/models/auth";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../utils/logger';
import { socketService } from "./socketService";

// ──────────────────────────────────────
// Chat Message Operations
// ──────────────────────────────────────

export async function getMessages(options: {
    chatType?: string;
    eventId?: string;
    countryCode?: string;
    limit?: number;
}) {
    const { chatType = 'global', eventId, countryCode, limit = 50 } = options;

    if (chatType === 'event' && eventId) {
        return db.select()
            .from(chatMessages)
            .where(and(
                eq(chatMessages.chatType, 'event'),
                eq(chatMessages.eventId, eventId)
            ))
            .orderBy(desc(chatMessages.createdAt))
            .limit(Number(limit));
    }

    if (chatType === 'country' && countryCode) {
        return db.select()
            .from(chatMessages)
            .where(and(
                eq(chatMessages.chatType, 'country'),
                eq(chatMessages.countryCode, countryCode)
            ))
            .orderBy(desc(chatMessages.createdAt))
            .limit(Number(limit));
    }

    // Default: global chat
    return db.select()
        .from(chatMessages)
        .where(eq(chatMessages.chatType, 'global'))
        .orderBy(desc(chatMessages.createdAt))
        .limit(Number(limit));
}

export async function postMessage(userId: string, message: string, options: {
    chatType?: string;
    eventId?: string;
    countryCode?: string;
}) {
    const { chatType = 'global', eventId, countryCode } = options;

    let resolvedCountryCode: string | null = null;

    if (chatType === 'country') {
        if (countryCode) {
            resolvedCountryCode = countryCode;
        } else {
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            resolvedCountryCode = user?.country || null;

            if (!resolvedCountryCode) {
                throw new Error('NO_COUNTRY_SET');
            }
        }
    }

    const [newMessage] = await db.insert(chatMessages)
        .values({
            id: uuidv4(),
            userId,
            eventId: chatType === 'event' ? eventId : null,
            chatType,
            countryCode: resolvedCountryCode,
            message: message.trim(),
            createdAt: new Date()
        })
        .returning();

    // Broadcast message via Socket.IO - Scrubbed for security
    const scrubbedMessage = {
        id: newMessage.id,
        message: newMessage.message,
        chatType: newMessage.chatType,
        eventId: newMessage.eventId,
        countryCode: newMessage.countryCode,
        createdAt: newMessage.createdAt,
        // userId is omitted or could be replaced with a display name if joined with users table
    };

    let room: string | undefined;
    if (chatType === 'event') {
        room = `event_${eventId}`;
    } else if (chatType === 'country') {
        room = `country_${resolvedCountryCode}`;
    }

    socketService.emit('new_message', scrubbedMessage, room);

    return newMessage;
}
