
import { createClient } from '@supabase/supabase-js';
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
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('🚀 Đang thực thi SQL Migration trên Supabase...');

    // Chúng ta sẽ sử dụng SQL trực tiếp thông qua RPC nếu có, 
    // hoặc thông qua việc gọi một Edge Function có quyền thực thi SQL.
    // Tuy nhiên, Supabase JS SDK không hỗ trợ chạy SQL trực tiếp trừ khi có hàm RPC custom.
    // Ở đây, tôi sẽ thử kiểm tra xem có hàm exec_sql hoặc tương tự không.

    // Giải pháp thay thế: Vì tôi có POSTGRES_URL, tôi sẽ dùng thư viện 'pg' nếu có trong project.
    // Tôi đã thấy project có 'pg' trong package.json.
    console.log('💡 Sử dụng thư viện pg để thực thi lệnh ALTER TABLE...');
}

import pkg from 'pg';
const { Client } = pkg;

async function runPgMigration() {
    const connectionString = env.POSTGRES_URL || env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) {
        console.error('❌ Không tìm thấy POSTGRES_URL');
        return;
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Đã kết nối tới Postgres');

        const sql = `
      ALTER TABLE public.reviews 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

      -- Cập nhật dữ liệu cũ
      UPDATE public.reviews 
      SET created_at = submitted_date 
      WHERE created_at IS NULL;
      
      -- Đảm bảo admin_users có cột username (đã xác nhận là TỒN TẠI, nhưng cứ check)
      -- Cập nhật kiểu dữ liệu nếu cần hoặc thêm index
      CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
    `;

        await client.query(sql);
        console.log('✅ Đã cập nhật Schema bảng reviews thành công!');
    } catch (err) {
        console.error('❌ Lỗi thực thi SQL:', err.message);
    } finally {
        await client.end();
    }
}

runPgMigration();
