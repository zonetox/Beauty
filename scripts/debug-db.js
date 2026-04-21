
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.POSTGRES_URL + '&sslmode=verify-full';
console.log('🔗 Using pooling connection string:', connectionString.split('@')[1]); // Hide password

const client = new pg.Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

client.on('error', err => {
    console.error('🔥 Client error:', err.message);
});

async function main() {
    try {
        console.log('⏳ Connecting...');
        await client.connect();
        console.log('✅ Connected!');

        console.log('🔍 SELECT 1...');
        const res = await client.query('SELECT 1');
        console.log('✅ Result:', res.rows);

        await client.end();
        console.log('👋 Bye!');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
}

main();
