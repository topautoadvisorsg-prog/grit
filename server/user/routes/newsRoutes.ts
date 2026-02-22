import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { logger } from '../../utils/logger';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

export function registerNewsRoutes(app: Express) {
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      const articles = await storage.getPublishedNewsArticles();
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = articles.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, articles.length, params));
      }
      res.json(articles);
    } catch (error) {
      logger.error("Error fetching news:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/fighter/:fighterId", async (req: Request, res: Response) => {
    try {
      const { fighterId } = req.params;
      const articles = await storage.getNewsArticlesByFighter(fighterId as string);
      res.json(articles);
    } catch (error) {
      logger.error("Error fetching fighter articles:", error);
      res.status(500).json({ error: "Failed to fetch fighter articles" });
    }
  });

  app.get("/api/news/:id", async (req: Request, res: Response) => {
    try {
      const article = await storage.getNewsArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      logger.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });
}
