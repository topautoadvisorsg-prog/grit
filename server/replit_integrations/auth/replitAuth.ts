import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { env } from "../../config/env";

const PgStore = connectPg(session);
export const sessionStore = new PgStore({
  conObject: {
    connectionString: env.DATABASE_URL,
  },
  createTableIfMissing: true,
  ttl: 7 * 24 * 60 * 60,
});

export const sessionMiddleware = session({
  secret: env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
  },
});

export function getSession() {
  return sessionMiddleware;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const { Strategy } = await import("passport-openidconnect");

  passport.use(
    "replit",
    new Strategy(
      {
        issuer: `https://replit.com/oidc`,
        authorizationURL: `https://replit.com/oidc/auth`,
        tokenURL: `https://replit.com/oidc/token`,
        userInfoURL: `https://replit.com/oidc/userinfo`,
        clientID: env.REPL_ID || '',
        clientSecret: env.REPL_ID || '',
        callbackURL: env.REPLIT_DEV_DOMAIN
          ? `https://${env.REPLIT_DEV_DOMAIN}/api/callback`
          : "/api/callback",
        scope: "openid email profile",
      },
      async (
        _issuer: string,
        profile: { _json?: Record<string, unknown> },
        done: (err: Error | null, user?: Express.User | false) => void
      ) => {
        try {
          const claims = profile._json || {};
          const user = await storage.upsertUser({
            id: String(claims.sub || ''),
            email: claims.email ? String(claims.email) : null,
            firstName: claims.first_name ? String(claims.first_name) : null,
            lastName: claims.last_name ? String(claims.last_name) : null,
            profileImageUrl: claims.profile_image_url ? String(claims.profile_image_url) : null,
          });
          done(null, user as Express.User);
        } catch (err) {
          done(err instanceof Error ? err : new Error(String(err)), false);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done: (err: Error | null, user?: Express.User | false) => void) => {
    try {
      const user = await storage.getUser(id);
      done(null, (user as Express.User) || false);
    } catch (err) {
      done(err instanceof Error ? err : new Error(String(err)), false);
    }
  });
}

/**
 * Register Replit OIDC login/callback/logout routes.
 * Calling this function "connects" the Replit OIDC to the application.
 */
export function registerReplitOIDCRoutes(app: Express) {
  app.get("/api/login", passport.authenticate("replit"));

  app.get(
    "/api/callback",
    passport.authenticate("replit", {
      failureRedirect: "/api/login",
    }),
    (_req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
