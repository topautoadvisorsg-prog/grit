
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
        console.log("🔧 Fixing Schema (Wins/Losses)...");

        const fighterCols = [
            `ADD COLUMN IF NOT EXISTS "wins" integer DEFAULT 0`,
            `ADD COLUMN IF NOT EXISTS "losses" integer DEFAULT 0`,
            `ADD COLUMN IF NOT EXISTS "draws" integer DEFAULT 0`,
            `ADD COLUMN IF NOT EXISTS "nc" integer DEFAULT 0`
        ];

        for (const col of fighterCols) {
            await client.query(`ALTER TABLE "fighters" ${col};`);
        }

        console.log("✅ Wins/Losses Added!");
    } catch (e) {
        console.error("❌ Error fixing schema:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
