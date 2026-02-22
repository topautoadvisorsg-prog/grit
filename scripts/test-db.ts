
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

console.log('--- DB Connection Test ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
const url = process.env.DATABASE_URL;

if (!url) {
    console.error('ERROR: DATABASE_URL is missing.');
    process.exit(1);
}

// Mask password for logging
const maskedUrl = url.replace(/:([^:@]+)@/, ':****@');
console.log('Connecting to:', maskedUrl);

const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false } // Required for Supabase in some environments
});

async function testConnection() {
    try {
        console.log('Attempting connection...');
        const client = await pool.connect();
        console.log('Connected! Running query...');
        const res = await client.query('SELECT version()');
        console.log('Success! DB Version:', res.rows[0].version);
        client.release();
        await pool.end();
        process.exit(0);
    } catch (err: any) {
        console.error('--- CONNECTION FAILURE ---');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('Hostname:', err.hostname);
        console.error('Syscall:', err.syscall);
        if (err.cause) console.error('Cause:', err.cause);
        console.error('Full Error:', JSON.stringify(err, null, 2));
        process.exit(1);
    }
}

testConnection();
