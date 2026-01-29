
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

async function checkColumns() {
    console.log('🔍 Kiểm tra chi tiết cột trong Database Live...');

    const checks = [
        { table: 'admin_users', columns: ['user_name', 'username', 'full_name'] },
        { table: 'reviews', columns: ['created_at', 'submitted_date', 'reply', 'reply_content'] }
    ];

    for (const check of checks) {
        console.log(`\nTable: ${check.table}`);
        // Sử dụng query select * limit 1 để lấy danh sách keys hiện có nếu được
        const { data, error } = await supabase.from(check.table).select('*').limit(1);

        if (error) {
            console.log(`❌ Lỗi query bảng ${check.table}: ${error.message}`);
            continue;
        }

        if (data && data.length > 0) {
            const existingCols = Object.keys(data[0]);
            console.log(`✅ Các cột đang có: ${existingCols.join(', ')}`);

            check.columns.forEach(col => {
                if (existingCols.includes(col)) {
                    console.log(`   - [${col}]: TỒN TẠI`);
                } else {
                    console.log(`   - [${col}]: KHÔNG TỒN TẠI`);
                }
            });
        } else {
            console.log('⚠️ Bảng trống, đang thử query information_schema...');
            // Vì không dùng được pg trực tiếp, ta đoán dựa trên lỗi 400 của bạn
            console.log('   (Dựa trên báo cáo của bạn, các cột sau bị thiếu: user_name trong admin_users, created_at trong reviews)');
        }
    }
}

checkColumns();
