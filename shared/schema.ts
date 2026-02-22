import { pgTable, text, varchar, boolean, integer, jsonb, timestamp, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

/**
 * Fighters table - Primary Data Authority
 * 
 * Stores all fighter profile data. 
 * Normalized for AI readiness and SQL queryability.
 */
export const fighters = pgTable("fighters", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 255 }),
  dateOfBirth: timestamp("date_of_birth"),
  nationality: varchar("nationality", { length: 255 }).notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  weightClass: varchar("weight_class", { length: 100 }).notNull(),
  stance: varchar("stance", { length: 50 }).notNull(),
  gym: varchar("gym", { length: 255 }).notNull(),
  headCoach: varchar("head_coach", { length: 255 }).notNull(),
  team: varchar("team", { length: 255 }),
  fightingOutOf: varchar("fighting_out_of", { length: 255 }),
  style: varchar("style", { length: 100 }),
  bio: text("bio"), // User biography
  aiPreferences: jsonb("ai_preferences").$type<{
    enabled: boolean;
    tier?: string;
  }>().default({ enabled: true }),
  socialMedia: jsonb("social_media").$type<{
    twitter?: string;
    instagram?: string;
    website?: string;
  }>(),

  // Physical Stats (Normalized from JSONB)
  height: real("height_inch"), // stored in inches
  reach: real("reach_inch"),   // stored in inches
  legReach: real("leg_reach_inch"),

  // Record (Normalized from JSONB)
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  nc: integer("nc").notNull().default(0),

  // Images
  imageUrl: text("image_url").notNull(),
  bodyImageUrl: text("body_image_url"),

  organization: varchar("organization", { length: 50 }).notNull(),

  // Legacy/Complex Nested objects as JSONB (Deprecating core stats)
  physicalStats: jsonb("physical_stats").notNull().default({}), // Deprecated
  record: jsonb("record").notNull().default({}),        // Deprecated
  performance: jsonb("performance").notNull().default({}),
  odds: jsonb("odds"),
  notes: jsonb("notes").notNull().default([]),
  riskSignals: jsonb("risk_signals").notNull().default([]),

  // Optional fields
  campStartDate: timestamp("camp_start_date"),
  trainingPartners: jsonb("training_partners"),
  dominantHand: varchar("dominant_hand", { length: 20 }),
  dominantFoot: varchar("dominant_foot", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  ranking: integer("ranking"),
  rankGlobal: integer("rank_global"),
  rankPromotion: integer("rank_promotion"),
  isChampion: boolean("is_champion").default(false),
  isVerified: boolean("is_verified").notNull().default(false),

  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Fight History table - Immutable Ledger
 */
export const fightHistory = pgTable("fight_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  fighterId: uuid("fighter_id").notNull(), // Should reference fighters.id
  eventId: uuid("event_id").notNull(),     // Should reference events.id

  // Fighter info (Snapshot)
  fighterName: varchar("fighter_name", { length: 255 }),
  fighterNickname: varchar("fighter_nickname", { length: 255 }),

  // Opponent info
  opponentId: uuid("opponent_id"),
  opponentName: varchar("opponent_name", { length: 255 }).notNull(),
  opponentNickname: varchar("opponent_nickname", { length: 255 }),
  opponentLinked: boolean("opponent_linked").notNull().default(true),

  // Event info
  eventName: varchar("event_name", { length: 500 }).notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventPromotion: varchar("event_promotion", { length: 100 }),
  weightClass: varchar("weight_class", { length: 100 }),
  fightType: varchar("fight_type", { length: 50 }).notNull(),
  billing: varchar("billing", { length: 100 }),
  boutOrder: integer("bout_order").notNull(),
  roundsScheduled: integer("rounds_scheduled"),
  roundDurationMinutes: integer("round_duration_minutes"),
  location: jsonb("location").notNull(),

  // Result
  result: varchar("result", { length: 20 }).notNull(),
  method: varchar("method", { length: 100 }).notNull(),
  methodDetail: varchar("method_detail", { length: 255 }),
  round: integer("round").notNull(),
  time: varchar("time", { length: 20 }).notNull(),
  fightDurationSeconds: integer("fight_duration_seconds").notNull(),
  titleFight: boolean("title_fight").notNull().default(false),
  titleFightDetail: varchar("title_fight_detail", { length: 255 }),
  referee: varchar("referee", { length: 255 }),
  roundTimeFormat: varchar("round_time_format", { length: 50 }),
  judgesScoresData: jsonb("judges_scores_data"),
  perRoundStats: jsonb("per_round_stats"),
  isLocked: boolean("is_locked").notNull().default(false),

  // Stats and odds as JSONB (could be normalized in future)
  stats: jsonb("stats"),
  oddsSnapshot: jsonb("odds_snapshot"),

  // Optional contextual fields
  travelDistance: integer("travel_distance"),
  venueAltitude: integer("venue_altitude"),
  mediaPressure: boolean("media_pressure"),
  gymChanges: boolean("gym_changes"),
  injuryFlags: jsonb("injury_flags"),
  refereeNotes: jsonb("referee_notes"),
  penaltyDeductions: jsonb("penalty_deductions"),
  weightCutSuccess: boolean("weight_cut_success"),
  adminNotes: jsonb("admin_notes"),

  // Versioning for audit trail
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Events table - Stores MMA event metadata
 */
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  date: timestamp("date").notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull(),
  organization: varchar("organization", { length: 50 }).notNull().default('UFC'),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default('Upcoming'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Event Fights table - Stores fights for each event
 */
export const eventFights = pgTable("event_fights", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  fighter1Id: uuid("fighter1_id").notNull(),
  fighter2Id: uuid("fighter2_id").notNull(),
  cardPlacement: varchar("card_placement", { length: 50 }).notNull(),
  boutOrder: integer("bout_order").notNull(),
  weightClass: varchar("weight_class", { length: 100 }).notNull(),
  isTitleFight: boolean("is_title_fight").notNull().default(false),
  rounds: integer("rounds").notNull().default(3),
  status: varchar("status", { length: 50 }).notNull().default('Scheduled'),

  // Odds set by admin for this specific fight
  odds: jsonb("odds").$type<{
    fighter1Odds?: string; // e.g. "-150", "+200"
    fighter2Odds?: string;
    overUnder?: string;
    source?: string;
  }>(),

  // Fight result fields
  timeFormat: varchar("time_format", { length: 50 }),
  roundEnd: integer("round_end"),
  timeEnd: varchar("time_end", { length: 20 }),
  method: varchar("method", { length: 100 }),
  referee: varchar("referee", { length: 255 }),
  winnerId: uuid("winner_id"),
  fighter1Result: varchar("fighter1_result", { length: 10 }),
  fighter2Result: varchar("fighter2_result", { length: 10 }),
});

/**
 * Judges Scores table
 */
export const judgesScores = pgTable("judges_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  judgeName: varchar("judge_name", { length: 255 }).notNull(),
  fighter1Score: integer("fighter1_score").notNull(),
  fighter2Score: integer("fighter2_score").notNull(),
});

/**
 * Fight Totals table
 */
export const fightTotals = pgTable("fight_totals", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  fighterId: uuid("fighter_id").notNull(),

  // Striking
  knockdowns: integer("knockdowns"),
  sigStrLanded: integer("sig_str_landed"),
  sigStrAttempted: integer("sig_str_attempted"),
  sigStrPercentage: integer("sig_str_percentage"),
  totalStrLanded: integer("total_str_landed"),
  totalStrAttempted: integer("total_str_attempted"),

  // Grappling
  takedownsLanded: integer("takedowns_landed"),
  takedownsAttempted: integer("takedowns_attempted"),
  takedownPercentage: integer("takedown_percentage"),
  submissionAttempts: integer("submission_attempts"),
  reversals: integer("reversals"),
  controlTime: varchar("control_time", { length: 20 }),
});

/**
 * Significant Strikes Breakdown table
 */
export const sigStrikesBreakdown = pgTable("sig_strikes_breakdown", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  fighterId: uuid("fighter_id").notNull(),

  // By Target
  headLanded: integer("head_landed"),
  headAttempted: integer("head_attempted"),
  bodyLanded: integer("body_landed"),
  bodyAttempted: integer("body_attempted"),
  legLanded: integer("leg_landed"),
  legAttempted: integer("leg_attempted"),

  // By Position
  distanceLanded: integer("distance_landed"),
  distanceAttempted: integer("distance_attempted"),
  clinchLanded: integer("clinch_landed"),
  clinchAttempted: integer("clinch_attempted"),
  groundLanded: integer("ground_landed"),
  groundAttempted: integer("ground_attempted"),
});

/**
 * Round Stats table - Per-round fight statistics
 */
export const roundStats = pgTable("round_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  fighterId: uuid("fighter_id").notNull(),
  roundNumber: integer("round_number").notNull(),

  // Significant Strikes
  sigStrLanded: integer("sig_str_landed"),
  sigStrAttempted: integer("sig_str_attempted"),
  sigStrPercentage: integer("sig_str_percentage"),

  // Total Strikes
  totalStrLanded: integer("total_str_landed"),
  totalStrAttempted: integer("total_str_attempted"),

  // Takedowns
  tdLanded: integer("td_landed"),
  tdAttempted: integer("td_attempted"),

  // Grappling
  subAttempts: integer("sub_attempts"),
  controlTime: varchar("control_time", { length: 20 }),

  // Knockdowns
  knockdowns: integer("knockdowns"),
});

// Card placement enum values for validation
export const CARD_PLACEMENTS = ['Main Event', 'Co-Main Event', 'Main Card', 'Preliminary'] as const;
export type CardPlacement = typeof CARD_PLACEMENTS[number];

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  tags: jsonb("tags").notNull().default([]),
  eventReference: uuid("event_reference"),   // FK to events
  fighterReference: uuid("fighter_reference"), // FK to fighters
  readTime: varchar("read_time", { length: 50 }),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Chat Messages table - Supports global, event, and country chat
 */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  eventId: uuid("event_id"), // Nullable - used for event chat
  chatType: varchar("chat_type", { length: 20 }).notNull().default('global'), // 'global' | 'event' | 'country'
  countryCode: varchar("country_code", { length: 10 }), // For country chat filtering
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fight History Audit Log - tracks admin edits for immutability
export const fightHistoryAudit = pgTable("fight_history_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightHistoryId: uuid("fight_history_id").notNull(),
  previousData: jsonb("previous_data").notNull(),
  changedBy: uuid("changed_by").notNull(),
  changeType: text("change_type").notNull(), // 'edit', 'stats_update', 'result_correction'
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Unmatched Opponents Log - for fuzzy matching fallback
export const unmatchedOpponents = pgTable("unmatched_opponents", {
  id: uuid("id").defaultRandom().primaryKey(),
  importedName: text("imported_name").notNull(),
  candidates: jsonb("candidates"),
  resolvedFighterId: uuid("resolved_fighter_id"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Prediction Cache - stores AI predictions with TTL
export const aiPredictionCache = pgTable("ai_prediction_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  model: text("model").notNull(),
  prediction: jsonb("prediction").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== NEW FEATURE TABLES ==========

/**
 * Fighter Tag Definitions — catalog of available tag types
 * Examples: Striking, Grappling, Aggressiveness, Cardio, Fight IQ
 */
export const fighterTagDefinitions = pgTable("fighter_tag_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default('Intangibles'), // Striking, Grappling, Athleticism, Fight IQ, Intangibles
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Fighter Tags — admin-assigned tag values per fighter
 * Each tag has a numeric value (1-10) and an admin-set color for visual signaling.
 * Future: AI will read these values + colors for analysis.
 */
export const fighterTags = pgTable("fighter_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  fighterId: uuid("fighter_id").notNull(),
  tagDefinitionId: uuid("tag_definition_id").notNull(),
  value: integer("value").notNull().default(5), // 1-10 scale
  color: varchar("color", { length: 20 }).notNull().default('#3b82f6'), // hex color
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * AI Chat Messages — conversational chat with AI (premium feature)
 * Can reference fighters, blogs, and tag data.
 */
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  message: text("message").notNull(),
  context: jsonb("context").$type<{
    fighterIds?: string[];
    articleIds?: string[];
    tagIds?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Raffle Tickets — admin-allocated tickets for subscription-verified users
 */
export const raffleTickets = pgTable("raffle_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  source: varchar("source", { length: 50 }).notNull().default('admin'), // 'admin' | 'subscription'
  eventId: uuid("event_id"), // Optional: tied to specific event
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Raffle Draws — results of raffle draws
 */
export const raffleDraws = pgTable("raffle_draws", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id"),
  winnerId: uuid("winner_id").notNull(),
  totalTickets: integer("total_tickets").notNull(),
  poolDescription: text("pool_description"),
  drawnAt: timestamp("drawn_at").defaultNow().notNull(),
});

/**
 * User Badges — badge framework for gamification (admin-assigned)
 */
export const userBadges = pgTable("user_badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  badgeType: varchar("badge_type", { length: 100 }).notNull().default('custom'),
  badgeName: varchar("badge_name", { length: 100 }).notNull().default('Badge'),
  badgeIcon: varchar("badge_icon", { length: 20 }).default('🏆'),
  reason: text("reason"),
  awardedBy: uuid("awarded_by"), // admin who assigned
  metadata: jsonb("metadata").default({}),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * AI Chat Configuration — Dynamic system instructions
 */
export const aiChatConfig = pgTable("ai_chat_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  section: varchar("section", { length: 50 }).notNull(), // 'behavior', 'functional', 'policy'
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by"), // admin id
});

/**
 * AI Chat Logs — Security and audit logs for blocked/flagged messages
 */
export const aiChatLogs = pgTable("ai_chat_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'allowed', 'blocked', 'flagged'
  violationReason: text("violation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Admin Audit Logs — tracks admin actions for accountability
 */
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: varchar("target_id", { length: 255 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * System Settings — key-value store for global config
 */
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * User Settings — gamification and notification preferences
 */
export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  enableSounds: boolean("enable_sounds").default(true),
  enableCelebrations: boolean("enable_celebrations").default(true),
  showStreaks: boolean("show_streaks").default(true),
  showBadges: boolean("show_badges").default(true),
  enablePushNotifications: boolean("enable_push_notifications").default(true),
  enableEventReminders: boolean("enable_event_reminders").default(true),
  enableResultAlerts: boolean("enable_result_alerts").default(true),
  enableLeaderboardUpdates: boolean("enable_leaderboard_updates").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export const insertFighterSchema = createInsertSchema(fighters, {
  dateOfBirth: z.coerce.date() as any,
  campStartDate: z.coerce.date() as any,
}).omit({ id: true, createdAt: true, lastUpdated: true });

export const insertFightHistorySchema = createInsertSchema(fightHistory, {
  eventDate: z.coerce.date() as any,
}).omit({ id: true });

export const insertEventSchema = createInsertSchema(events, {
  date: z.coerce.date() as any,
}).omit({ id: true, createdAt: true });

export const insertEventFightSchema = createInsertSchema(eventFights).omit({ id: true });

export const insertNewsArticleSchema = createInsertSchema(newsArticles, {
  publishedAt: z.coerce.date() as any,
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertJudgesScoreSchema = createInsertSchema(judgesScores).omit({ id: true });
export const insertFightTotalsSchema = createInsertSchema(fightTotals).omit({ id: true });
export const insertSigStrikesBreakdownSchema = createInsertSchema(sigStrikesBreakdown).omit({ id: true });
export const insertRoundStatsSchema = createInsertSchema(roundStats).omit({ id: true });

// New table insert schemas
export const insertFighterTagDefinitionSchema = createInsertSchema(fighterTagDefinitions).omit({ id: true, createdAt: true });
export const insertFighterTagSchema = createInsertSchema(fighterTags).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).omit({ id: true, createdAt: true });
export const insertRaffleTicketSchema = createInsertSchema(raffleTickets).omit({ id: true, createdAt: true });
export const insertRaffleDrawSchema = createInsertSchema(raffleDraws).omit({ id: true, drawnAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, createdAt: true });
export const insertAiChatConfigSchema = createInsertSchema(aiChatConfig).omit({ id: true, updatedAt: true });
export const insertAiChatLogSchema = createInsertSchema(aiChatLogs).omit({ id: true, createdAt: true });

// Types
export type Fighter = typeof fighters.$inferSelect;
export type InsertFighter = z.infer<typeof insertFighterSchema>;
export type FightHistory = typeof fightHistory.$inferSelect;
export type InsertFightHistory = z.infer<typeof insertFightHistorySchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventFight = typeof eventFights.$inferSelect;
export type InsertEventFight = z.infer<typeof insertEventFightSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type JudgesScore = typeof judgesScores.$inferSelect;
export type InsertJudgesScore = z.infer<typeof insertJudgesScoreSchema>;
export type FightTotals = typeof fightTotals.$inferSelect;
export type InsertFightTotals = z.infer<typeof insertFightTotalsSchema>;
export type SigStrikesBreakdown = typeof sigStrikesBreakdown.$inferSelect;
export type InsertSigStrikesBreakdown = z.infer<typeof insertSigStrikesBreakdownSchema>;
export type RoundStats = typeof roundStats.$inferSelect;
export type InsertRoundStats = z.infer<typeof insertRoundStatsSchema>;

// New table types
export type FighterTagDefinition = typeof fighterTagDefinitions.$inferSelect;
export type InsertFighterTagDefinition = z.infer<typeof insertFighterTagDefinitionSchema>;
export type FighterTag = typeof fighterTags.$inferSelect;
export type InsertFighterTag = z.infer<typeof insertFighterTagSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type RaffleTicket = typeof raffleTickets.$inferSelect;
export type InsertRaffleTicket = z.infer<typeof insertRaffleTicketSchema>;
export type RaffleDraw = typeof raffleDraws.$inferSelect;
export type InsertRaffleDraw = z.infer<typeof insertRaffleDrawSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type AiChatConfig = typeof aiChatConfig.$inferSelect;
export type InsertAiChatConfig = z.infer<typeof insertAiChatConfigSchema>;
export type AiChatLog = typeof aiChatLogs.$inferSelect;
export type InsertAiChatLog = z.infer<typeof insertAiChatLogSchema>;

