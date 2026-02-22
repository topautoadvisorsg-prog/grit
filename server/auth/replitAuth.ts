import type { RequestHandler, Request, Response, NextFunction } from 'express';

export const isAuthenticated: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized: No session' });
};

export const requireAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
    }

    const user = req.user as any;
    if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    next();
};

export function isAdmin(req: Request): boolean {
    return (req.user as any)?.role === 'admin';
}
