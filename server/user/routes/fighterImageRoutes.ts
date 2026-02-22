import type { Express, Request, Response } from "express";
import { isAuthenticated } from '../../auth/replitAuth';

export function registerFighterImageRoutes(app: Express): void {
  app.post("/api/fighter/image/request-url", isAuthenticated, async (req: Request, res: Response) => {
    res.status(501).json({ error: "Image upload temporarily disabled during Supabase migration." });
  });

  app.post("/api/fighter/image/confirm", isAuthenticated, async (req: Request, res: Response) => {
    res.status(501).json({ error: "Image upload temporarily disabled during Supabase migration." });
  });
}
