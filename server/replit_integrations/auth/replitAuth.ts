import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const PgStore = connectPg(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60;
  return session({
    secret: process.env.SESSION_SECRET!,
    store: new PgStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
      ttl: sessionTtl,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl * 1000,
      sameSite: "lax",
    },
  });
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
        clientID: process.env.REPL_ID!,
        clientSecret: process.env.REPL_ID!,
        callbackURL: process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/callback`
          : "/api/callback",
        scope: "openid email profile",
      },
      async (
        _issuer: string,
        profile: any,
        done: (err: any, user?: any) => void
      ) => {
        try {
          const claims = profile._json;
          const user = await storage.upsertUser({
            id: claims.sub,
            email: claims.email || null,
            firstName: claims.first_name || null,
            lastName: claims.last_name || null,
            profileImageUrl: claims.profile_image_url || null,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

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
