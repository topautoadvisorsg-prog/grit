
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
        console.log("🔧 Converting users.id to UUID...");
        await client.query(`ALTER TABLE "users" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;`);
        console.log("✅ Users ID converted to UUID!");
    } catch (e) {
        console.error("❌ Error converting ID:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
