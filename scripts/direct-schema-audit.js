
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load .env.local
function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        }
    });
    return env;
}

const env = loadEnvFile(path.join(rootDir, '.env.local'));
const connectionString = env.POSTGRES_URL || env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
    console.error('❌ Không tìm thấy POSTGRES_URL trong .env.local');
    process.exit(1);
}

async function runAudit() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('✅ Đã kết nối trực tiếp tới Supabase Postgres');

        // Query tables
        const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

        const tables = tablesRes.rows.map(r => r.table_name);
        console.log(`\n📊 Tìm thấy ${tables.length} bảng trong Database live:`);
        console.log(tables.join(', '));

        // Check specific tables of interest
        const targetTables = ['membership_packages', 'blog_categories', 'page_views', 'conversions', 'business_staff', 'abuse_reports'];
        console.log('\n🔍 Kiểm tra các bảng quan trọng:');

        for (const table of targetTables) {
            if (tables.includes(table)) {
                console.log(`✅ [${table}] - Đã tồn tại`);
                const columnsRes = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `, [table]);
                console.log(`   Cột: ${columnsRes.rows.map(c => `${c.column_name} (${c.data_type})`).join(', ')}`);
            } else {
                console.log(`❌ [${table}] - KHÔNG tìm thấy trong DB thực tế!`);
            }
        }

        // Check blog_posts status column
        console.log('\n🔍 Kiểm tra cột status trong blog_posts:');
        const blogPostsCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'blog_posts' AND column_name = 'status';
    `);
        if (blogPostsCols.rows.length > 0) {
            console.log('✅ Cột [status] đã tồn tại trong blog_posts');
        } else {
            console.log('❌ Cột [status] KHÔNG tìm thấy trong blog_posts!');
        }

    } catch (err) {
        console.error('❌ Lỗi truy vấn:', err.message);
    } finally {
        await client.end();
    }
}

runAudit();
