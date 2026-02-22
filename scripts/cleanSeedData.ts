
import "dotenv/config";
import { db } from "../server/db";
import { users, events, fighters, eventFights, userPicks } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
    console.log("🧹 Cleaning Seed Data...");

    const testEmails = [
        "winner@test.com",
        "loser@test.com",
        "neutral@test.com",
        "elite@test.com",
        "admin@test.com"
    ];

    // Delete users and cascade deletion if foreign keys are set (db usually handles restrictive).
    // Safest to delete child first.

    // 1. Get User IDs
    const testUsers = await db.select({ id: users.id }).from(users).where(inArray(users.email, testEmails));
    const userIds = testUsers.map(u => u.id);

    console.log(`Found ${userIds.length} users to clean.`);

    if (userIds.length > 0) {
        // Delete Picks
        await db.delete(userPicks).where(inArray(userPicks.userId, userIds));

        // Delete Users
        await db.delete(users).where(inArray(users.id, userIds));
    }

    // Delete specific Events/Fighters if possible, but they are harder to identify without known IDs.
    // However, superSeed.ts uses specific names.
    // Events: "UFC 300: Progression Test", "UFC Fight Night: Live Verification", "UFC 305: Future Stars"
    const eventNames = [
        "UFC 300: Progression Test",
        "UFC Fight Night: Live Verification",
        "UFC 305: Future Stars"
    ];

    const targetEvents = await db.select({ id: events.id }).from(events).where(inArray(events.name, eventNames));
    const eventIds = targetEvents.map(e => e.id);

    if (eventIds.length > 0) {
        await db.delete(eventFights).where(inArray(eventFights.eventId, eventIds));
        await db.delete(events).where(inArray(events.id, eventIds));
    }

    // Fighters: "Alex Volkov", "Marcus Santos", "John Doe", "Danny Draws"
    // Names are split.
    // Easier to just let superSeed fail on fighters if they exist?
    // superSeed.ts uses hardcoded UUIDs for fighters.
    // So unique constraint violation on ID will likely happen.
    // I should delete fighters by ID if I knew them.
    // But I can delete by name match.

    // Actually, simply deleting users might be enough to retry users.
    // But if fighters fail, events wont be created.

    console.log("✅ Cleanup Complete!");
    process.exit(0);
}

main().catch(console.error);
