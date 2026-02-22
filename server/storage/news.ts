
import { newsArticles, type NewsArticle, type InsertNewsArticle } from "../../shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

export interface INewsStorage {
    getAllNewsArticles(): Promise<NewsArticle[]>;
    getPublishedNewsArticles(): Promise<NewsArticle[]>;
    getNewsArticle(id: string): Promise<NewsArticle | undefined>;
    createNewsArticle(article: InsertNewsArticle & { id: string; createdAt: Date; updatedAt: Date }): Promise<NewsArticle>;
    updateNewsArticle(id: string, article: Partial<InsertNewsArticle> & { updatedAt: Date }): Promise<NewsArticle | undefined>;
    deleteNewsArticle(id: string): Promise<boolean>;
    getNewsArticlesByFighter(fighterId: string): Promise<NewsArticle[]>;
}

export class NewsStorage implements INewsStorage {
    async getAllNewsArticles(): Promise<NewsArticle[]> {
        return await db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
    }

    async getPublishedNewsArticles(): Promise<NewsArticle[]> {
        return await db.select().from(newsArticles)
            .where(eq(newsArticles.isPublished, true))
            .orderBy(desc(newsArticles.publishedAt));
    }

    async getNewsArticlesByFighter(fighterId: string): Promise<NewsArticle[]> {
        return await db.select().from(newsArticles)
            .where(eq(newsArticles.fighterReference, fighterId))
            .orderBy(desc(newsArticles.publishedAt));
    }

    async getNewsArticle(id: string): Promise<NewsArticle | undefined> {
        const [article] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
        return article || undefined;
    }

    async createNewsArticle(article: InsertNewsArticle & { id: string; createdAt: Date; updatedAt: Date }): Promise<NewsArticle> {
        const [created] = await db.insert(newsArticles).values(article).returning();
        return created;
    }

    async updateNewsArticle(id: string, article: Partial<InsertNewsArticle> & { updatedAt: Date }): Promise<NewsArticle | undefined> {
        const [updated] = await db.update(newsArticles).set(article).where(eq(newsArticles.id, id)).returning();
        return updated || undefined;
    }

    async deleteNewsArticle(id: string): Promise<boolean> {
        const result = await db.delete(newsArticles).where(eq(newsArticles.id, id)).returning();
        return result.length > 0;
    }
}
