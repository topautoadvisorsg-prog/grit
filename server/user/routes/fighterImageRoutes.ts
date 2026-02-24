import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';

export function registerFighterImageRoutes(app: Express): void {
  app.post("/api/fighter/image/request-url", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    res.status(501).json({ error: "Image upload temporarily disabled during Supabase migration." });
  });

  app.post("/api/fighter/image/confirm", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    res.status(501).json({ error: "Image upload temporarily disabled during Supabase migration." });
  });
}
