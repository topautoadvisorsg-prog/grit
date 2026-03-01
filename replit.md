# GRIT

## Overview

GRIT is a professional Global MMA Fantasy League platform for analytics, scouting, and competition. It centralizes fighter data, fight history, events, rankings, and user picks into a unified system, with the **Fighter Profile as the Source of Truth**.

## User Preferences

- No duplicated logic
- No unused files
- No hardcoded mock data in production paths
- Strict TypeScript typing
- Consistent naming conventions
- Follow existing patterns
- Do NOT introduce parallel data systems
- All fighter data flows through Fighter Profiles
- Use existing hooks and contexts
- DO NOT DELETE MOCK DATA — preserve all mock files for testing/development
- Every implemented feature MUST:
    - Update this README
    - Document new fields
    - Document schema changes
    - Document new API endpoints

## System Architecture

The application is built with a **Fighter Profile as the Source of Truth** architecture, where all fighter data originates from and is managed through the Fighter Profile module.

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI
- **State Management:** TanStack Query, React Context
- **Backend:** Express.js
- **Database:** PostgreSQL (Neon-backed via Replit)
- **ORM:** Drizzle ORM
- **Authentication:** Replit Auth (OpenID Connect PKCE)
- **Storage:** Replit Object Storage (GCS-backed)
- **Validation:** Zod schemas with Express middleware
- **Rate Limiting:** express-rate-limit (3 tiers: public/strict/auth)
- **Logging:** Centralized logger (`server/utils/logger.ts`) — all server files use `logger.info/error/debug/warn`

**Domain-Separated Architecture:**
The codebase is organized into `admin/`, `user/`, and `shared/` domains for both frontend and backend components, ensuring clear separation of concerns.

**Core Modules:**
- **Fighter Database:** Centralized fighter profiles with verified status.
- **Fight History Ledger:** API-driven fight records (GET /api/fights, POST /api/fights/bulk) persisted to PostgreSQL. No localStorage dependency.
- **Events & Fight Cards:** Management of upcoming and completed events.
- **Rankings & Metrics:** Leaderboards based on prediction accuracy and comprehensive fighter performance metrics.
- **User Picks & Leaderboards:** System for user predictions (winner, method, round) and competitive leaderboards with a fantasy scoring system.
- **News System:** Curated articles and research content.
- **Import/Export Engine:** Tools for data ingestion (CSV) and extraction (CSV) with flexible field mapping. Utility modules: `csvParser.ts`, `autoMapper.ts`, `duplicateDetection.ts`.
- **Admin Panel:** Comprehensive management interface for events, fighters, news, and data imports.
- **Dashboard Widgets:** StatsWidget, CountdownWidget, BadgeWidget, ActivityWidget — real API data bindings.

**Data Flow Model:**
Data is ingested via CSV, API, or Admin Input, populates Fighter & Fight History Tables, which then feed into **Fighter Profiles (Source of Truth)**. This central data then drives Events, Rankings, Picks, Analytics, and the User Interface.

**UI/UX Decisions:**
The frontend utilizes React with Tailwind CSS for a modern, responsive design. Key UI components include:
- **Event Card Tab:** Displays upcoming fights, fighter details, and title fight indicators.
- **MMA Metrics Rankings Tab:** Shows fantasy leaderboards with user rankings and points.
- **Fighter Profiles Tab:** Central hub for fighter data, including identity, stats, physical attributes, performance metrics, fight history, betting odds, risk signals, and notes, with filtering options.
- **Event History Tab:** Allows review of completed events and tracks user pick performance.
- **News Tab:** Displays MMA news articles.
- **Export Tab:** Facilitates data extraction to CSV.
- **Admin Tabs:** Dedicated sections for `Create Event`, `Import Data`, `Fighter Manager`, and `Create News`.
- **Standalone Pages:** `Fight Detail Page`, `Settings Page`, `Admin Fight Cards Page`.

**Authentication & Authorization:**
Admin access is controlled by a user's `role` field in the database or matching the `ADMIN_EMAIL` environment variable, enforced by `requireAdmin` middleware for all admin endpoints.

## Component Structure

**Split Pages (modularized):**
- `src/pages/LandingPage.tsx` → 12 components in `src/pages/landing/` (hooks, Navbar, HeroSection, AICompetitionSection, SocialProofStrip, IntroSection, ShowcaseSections, Tier2Features, HowItWorks, LeaderboardPreview, PricingSection, FooterCTA)
- `src/pages/Settings.tsx` → 6 components in `src/pages/settings/` (types, ProfileTab, PrivacyTab, NotificationsTab, GamificationTab, AccountTab)
- `src/admin/components/import/ImportPage.tsx` → 3 utility modules (csvParser, autoMapper, duplicateDetection)

## Server Middleware

- **Validation:** `server/middleware/validate.ts` — Generic Zod validation middleware
- **Rate Limiting:** `server/middleware/rateLimiter.ts` — 3 tiers: publicApiLimiter (100/15min), strictApiLimiter (30/15min), authApiLimiter (200/15min)
- **Schemas:** `server/schemas/index.ts` — 12 Zod schemas for POST/PUT/PATCH endpoints
- **Pagination:** `server/utils/pagination.ts` — Backward-compatible pagination for list endpoints (fighters, fights, events, news, leaderboard)

## API Pagination

List endpoints support optional `?page=N&limit=M` query parameters:
- Without params: Returns all results (backward compatible)
- With params: Returns `{ data: [...], pagination: { page, limit, total, totalPages, hasMore } }`
- Supported endpoints: GET /api/fighters, GET /api/fights, GET /api/events, GET /api/events/completed, GET /api/news, GET /api/leaderboard

## Mock Data (DO NOT DELETE)

- `src/shared/data/mockFighters.ts` (329 lines)
- `src/shared/data/mockFighter.ts` (265 lines)
- `src/shared/data/mockEvent.ts` (156 lines)
- `generateMockActivities` function in Dashboard widgets

## External Dependencies

- **Replit Auth:** Used for user authentication via OpenID Connect PKCE.
- **Replit Object Storage:** Utilized for storing assets like fighter images and user avatars, backed by Google Cloud Storage.
- **Neon (PostgreSQL):** Provides the managed PostgreSQL database service.

## Recent Changes

- **2026-02-21:** Full i18n wiring — all 10+ landing page components use `useTranslation()` with 144 keys across 8 locale files (en, es, fr, pt, ja, ko, ru + en-US/es-ES variants). Language selector in Navbar. Login flow fixed for iframe context (`window.open` instead of `location.href`). ADMIN_EMAIL updated.
- **2026-02-21:** Conservative cleanup pass — removed dead code (ParticleCanvas.tsx, auth-utils.ts, NavLink.tsx, .lp-hero__canvas CSS), added es-ES locale bundle, orphan scan verified no false removals
- **2026-02-21:** Hero video background — replaced ParticleCanvas/frame animation with a single `<video>` element (`public/hero_bg.mp4`) using autoplay, loop, muted, playsInline. Hardware-decoded by browser, no JS animation overhead. Dark gradient overlay for text readability.
- **2026-02-21:** Centralized logger migration (35+ server files), component splits (LandingPage/Settings/ImportPage), Zod validation on 11 endpoints, rate limiting on all API paths, pagination on 6 list endpoints
- **2026-02-21:** Fight History API migration (localStorage → PostgreSQL), Dashboard widget activation, architecture isolation verification
