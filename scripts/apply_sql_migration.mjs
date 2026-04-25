import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
}

async function runMigration() {
    const client = new Client({
        connectionString: dbUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log("Connecting to database...");
        await client.connect();
        console.log("Connected successfully.");

        const sqlPath = 'database/upgrade_get_user_context_v1.2.sql';
        console.log(`Reading SQL from ${sqlPath}...`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing migration SQL...");
        await client.query(sql);
        console.log("✅ Migration applied successfully!");

    } catch (err) {
        console.error("❌ Migration FAILED:", err.message);
    } finally {
        await client.end();
    }
}

runMigration();
