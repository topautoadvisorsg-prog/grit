
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL must be set");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        console.log("💣 Nuking Content & Aux Tables...");

        const tables = [
            'user_picks', 'fight_results', 'round_stats', 'fight_totals',
            'sig_strikes_breakdown', 'judges_scores', 'event_fights', 'fight_history',
            'fight_history_audit', 'raffle_tickets', 'raffle_draws',
            'ai_chat_messages', 'ai_prediction_cache',
            'fighter_tags', 'fighter_tag_definitions',
            'events', 'fighters', 'news_articles', 'chat_messages',
            // New additions
            'user_badges', 'unmatched_opponents', 'user_blocks',
            'user_mutes', 'user_reports', 'leaderboard_snapshots'
        ];

        for (const table of tables) {
            await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
            console.log(`Dropped ${table}`);
        }

        console.log("✅ All Non-User Tables Nuked!");
    } catch (e) {
        console.error("❌ Error nuking tables:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
