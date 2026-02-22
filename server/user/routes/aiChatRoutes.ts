import type { Express, Request, Response } from "express";

import { isAuthenticated } from '../../auth/replitAuth';
import { requireTier } from "../../auth/tierMiddleware";
import { db } from "../../db";
import {
    aiChatMessages, fighters, newsArticles, fighterTags, fighterTagDefinitions,
    events, eventFights, aiChatConfig, aiChatLogs, users
} from "../../../shared/schema";
import { userPicks } from "../../../shared/models/auth";
import { eq, desc, and, asc, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';

let configCache: { [key: string]: string } | null = null;
let lastConfigFetch = 0;

async function getAiConfig() {
    const now = Date.now();
    if (configCache && (now - lastConfigFetch < 60000)) {
        return configCache;
    }

    const configs = await db.select().from(aiChatConfig);
    const cache: { [key: string]: string } = {};
    configs.forEach(c => cache[c.section] = c.content);

    configCache = cache;
    lastConfigFetch = now;
    return cache;
}

export function registerAIChatRoutes(app: Express) {

    // --- User Chat Routes ---

    app.get("/api/ai/chat/history", isAuthenticated, requireTier('premium'), async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const { limit = 50 } = req.query;

            const messages = await db.select()
                .from(aiChatMessages)
                .where(eq(aiChatMessages.userId, userId))
                .orderBy(asc(aiChatMessages.createdAt))
                .limit(Number(limit));

            res.json(messages);
        } catch (error) {
            logger.error("Error fetching AI chat history:", error);
            res.status(500).json({ error: "Failed to fetch chat history" });
        }
    });

    app.post("/api/ai/chat", isAuthenticated, requireTier('premium'), async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const { message, context } = req.body;

            const [user] = await db.select().from(users).where(eq(users.id, userId));
            if (user?.isAiChatBlocked) {
                return res.status(403).json({ error: "Access to AI Chat is blocked due to policy violations." });
            }

            if (!message || message.trim().length === 0) {
                return res.status(400).json({ error: "Message cannot be empty" });
            }

            const config = await getAiConfig();
            const { OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const moderation = await openai.moderations.create({ input: message });
            if (moderation.results[0].flagged) {
                await db.insert(aiChatLogs).values({
                    userId,
                    message: message.trim(),
                    status: 'blocked',
                    violationReason: 'OpenAI Moderation Flag: ' + Object.keys(moderation.results[0].categories).filter((k: any) => (moderation.results[0].categories as any)[k]).join(', ')
                });
                return res.status(400).json({ error: "Message violates content policy (Moderation)." });
            }

            const userLang = user?.language || 'en';
            const userCountry = user?.country || 'Unknown';

            const behavior = config['behavior'] || "You are an MMA expert.";
            const functional = config['functional'] || "Discuss only MMA.";
            const policy = config['policy'] || "Block unrelated topics.";

            let systemPrompt = `${behavior}\n\n${functional}\n\n${policy}\n\nUser Context: Country: ${userCountry}, Language: ${userLang}. IMPORTANT: Reply in ${userLang}.`;

            let contextInfo = "";

            if (context?.fighterIds?.length) {
                const referencedFighters = await db.select().from(fighters).where(inArray(fighters.id, context.fighterIds));
                for (const f of referencedFighters) {
                    contextInfo += `\nFighter Data: ${f.firstName} ${f.lastName} | Record: ${f.wins}-${f.losses}-${f.draws} | Weight: ${f.weightClass} | Gym: ${f.gym}`;
                }
            }
            if (context?.articleIds?.length) {
                const articles = await db.select().from(newsArticles).where(inArray(newsArticles.id, context.articleIds));
                for (const a of articles) {
                    contextInfo += `\nArticle: "${a.title}" - ${a.excerpt}`;
                }
            }

            try {
                const [nextEvent] = await db.select().from(events)
                    .where(inArray(events.status, ['Upcoming', 'Live']))
                    .orderBy(events.date)
                    .limit(1);

                if (nextEvent) {
                    contextInfo += `\n\nUpcoming Event: ${nextEvent.name} (${nextEvent.date}, ${nextEvent.venue})`;
                    const fights = await db.select().from(eventFights).where(eq(eventFights.eventId, nextEvent.id));

                    const importantFights = fights.slice(0, 5);
                    for (const fight of importantFights) {
                        const f1 = await db.select().from(fighters).where(eq(fighters.id, fight.fighter1Id)).then(r => r[0]);
                        const f2 = await db.select().from(fighters).where(eq(fighters.id, fight.fighter2Id)).then(r => r[0]);
                        contextInfo += `\nFight: ${f1?.firstName} ${f1?.lastName} vs ${f2?.firstName} ${f2?.lastName} | ${fight.weightClass}`;
                    }
                }
            } catch (e) {
                logger.warn("Auto-context failed", e);
            }

            if (contextInfo) {
                systemPrompt += `\n\nDATABASE CONTEXT:\n${contextInfo}`;
            }

            const recentHistory = await db.select()
                .from(aiChatMessages)
                .where(eq(aiChatMessages.userId, userId))
                .orderBy(desc(aiChatMessages.createdAt))
                .limit(10);

            const messages: any[] = [
                { role: 'system', content: systemPrompt },
                ...recentHistory.reverse().map(m => ({ role: m.role, content: m.message })),
                { role: 'user', content: message.trim() }
            ];

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                max_tokens: 1000,
                temperature: 0.7,
            });

            const aiResponse = completion.choices[0]?.message?.content || "";

            if (aiResponse.includes("BLOCK_USER")) {
                await db.update(users).set({ isAiChatBlocked: true }).where(eq(users.id, userId));
                await db.insert(aiChatLogs).values({
                    userId,
                    message: message.trim(),
                    status: 'blocked',
                    violationReason: 'AI Triggered Block (Jailbreak/Abuse)'
                });
                return res.status(403).json({ error: "Your access to AI chat has been suspended due to policy violations." });
            }

            await db.insert(aiChatLogs).values({
                userId,
                message: message.trim(),
                status: 'allowed',
            });

            const [userMsg] = await db.insert(aiChatMessages).values({
                id: uuidv4(),
                userId,
                role: 'user',
                message: message.trim(),
                context: context || null,
                createdAt: new Date(),
            }).returning();

            const [aiMsg] = await db.insert(aiChatMessages).values({
                id: uuidv4(),
                userId,
                role: 'assistant',
                message: aiResponse,
                context: null,
                createdAt: new Date(),
            }).returning();

            res.json({ userMessage: userMsg, aiMessage: aiMsg });

        } catch (error: any) {
            logger.error("AI chat error:", error);
            if (error.message?.includes('API key')) return res.status(500).json({ error: "AI service not configured" });
            res.status(500).json({ error: "Failed to process AI chat message" });
        }
    });

    app.delete("/api/ai/chat/history", isAuthenticated, requireTier('premium'), async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            await db.delete(aiChatMessages).where(eq(aiChatMessages.userId, userId));
            res.json({ success: true });
        } catch (error) {
            logger.error("Error clearing chat history:", error);
            res.status(500).json({ error: "Failed to clear chat history" });
        }
    });
}
