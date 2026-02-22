import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sessions table removed (Supabase Auth handles sessions)

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),

  // Extended profile fields
  username: varchar("username", { length: 50 }).unique(),
  avatarUrl: varchar("avatar_url"),
  socialLinks: jsonb("social_links").$type<{
    twitter?: string;
    instagram?: string;
    tiktok?: string;
  }>().default({}),
  privacySettings: jsonb("privacy_settings").$type<{
    showAvatar: boolean;
    showSocialLinks: boolean;
    showUsername: boolean;
  }>().default({ showAvatar: true, showSocialLinks: true, showUsername: true }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  tier: varchar("tier", { length: 20 }).notNull().default("free"), // 'free' | 'medium' | 'premium'
  totalPoints: integer("total_points").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  country: varchar("country", { length: 100 }),
  language: varchar("language", { length: 10 }).default("en"),
  featuredInfluencer: boolean("featured_influencer").notNull().default(false),

  // Stars & Progressive Badges system
  starLevel: integer("star_level").notNull().default(0),               // 0-5
  progressBadge: varchar("progress_badge", { length: 20 }).notNull().default("none"),
  // 'none' | 'ninja' | 'samurai' | 'master' | 'goat'
  lastProgressionCalc: timestamp("last_progression_calc"),

  // Gamification: Login Tracking (New)
  monthlyLoginCount: integer("monthly_login_count").default(0),
  lastLoginMonth: varchar("last_login_month", { length: 7 }), // Format: "YYYY-MM"
  lastLoginDate: timestamp("last_login_date"),

  // Security
  isAiChatBlocked: boolean("is_ai_chat_blocked").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User picks table for fantasy predictions
export const userPicks = pgTable("user_picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fightId: varchar("fight_id").notNull(),
  pickedFighterId: varchar("picked_fighter_id").notNull(),
  pickedMethod: varchar("picked_method", { length: 50 }).notNull(),
  pickedRound: integer("picked_round"),
  units: integer("units").notNull().default(1), // 1-5 unit scale
  pointsAwarded: integer("points_awarded").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'voided'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fight results table for scoring
export const fightResults = pgTable("fight_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fightId: varchar("fight_id").notNull().unique(),
  winnerId: varchar("winner_id"),
  method: varchar("method", { length: 50 }),
  methodDetail: varchar("method_detail", { length: 255 }),
  round: integer("round"),
  time: varchar("time", { length: 20 }),
  referee: varchar("referee", { length: 255 }),
  stats: jsonb("stats").$type<{
    fighter1Stats?: Record<string, any>;
    fighter2Stats?: Record<string, any>;
  }>(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== MODERATION TABLES ==========

// User Blocks - Server-enforced blocking
export const userBlocks = pgTable("user_blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  blockerId: uuid("blocker_id").notNull(), // User who blocks
  blockedId: uuid("blocked_id").notNull(), // User who is blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// User Mutes - User-level suppression (soft)
export const userMutes = pgTable("user_mutes", {
  id: uuid("id").defaultRandom().primaryKey(),
  muterId: uuid("muter_id").notNull(), // User who mutes
  mutedId: uuid("muted_id").notNull(), // User who is muted
  expiresAt: timestamp("expires_at"), // null = permanent
  createdAt: timestamp("created_at").defaultNow(),
});

// User Reports - Admin review queue
export const userReports = pgTable("user_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterId: uuid("reporter_id").notNull(), // User who reports
  reportedId: uuid("reported_id").notNull(), // User who is reported
  reason: varchar("reason", { length: 500 }).notNull(),
  details: varchar("details", { length: 2000 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'reviewed' | 'actioned' | 'dismissed'
  adminNotes: varchar("admin_notes", { length: 2000 }),
  resolvedBy: uuid("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== LEADERBOARD SNAPSHOTS ==========

// Leaderboard Snapshots - Historical rankings preservation
export const leaderboardSnapshots = pgTable("leaderboard_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  snapshotType: varchar("snapshot_type", { length: 20 }).notNull(), // 'event' | 'monthly' | 'weekly'
  eventId: uuid("event_id"), // null for monthly/weekly snapshots
  snapshotDate: timestamp("snapshot_date").notNull(),
  rankings: jsonb("rankings").$type<{
    userId: string;
    rank: number;
    totalPoints: number;
    username?: string;
  }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const updateUserProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  socialLinks: z.object({
    twitter: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
    tiktok: z.string().url().optional().or(z.literal("")),
  }).optional(),
  privacySettings: z.object({
    showAvatar: z.boolean(),
    showSocialLinks: z.boolean(),
    showUsername: z.boolean(),
  }).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
});

export const insertUserPickSchema = createInsertSchema(userPicks).omit({ id: true, createdAt: true, updatedAt: true, pointsAwarded: true, isLocked: true });
export const insertFightResultSchema = createInsertSchema(fightResults).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserPick = typeof userPicks.$inferSelect;
export type InsertUserPick = z.infer<typeof insertUserPickSchema>;
export type FightResult = typeof fightResults.$inferSelect;
export type InsertFightResult = z.infer<typeof insertFightResultSchema>;
