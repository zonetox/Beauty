
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

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogsTable() {
    console.log('🔍 Kiểm tra schema bảng admin_activity_logs...');
    const { data, error } = await supabase.from('admin_activity_logs').select('*').limit(1);
    if (error) {
        console.log(`❌ Lỗi: ${error.message}`);
    } else if (data && data.length > 0) {
        console.log(`✅ Các cột của admin_activity_logs: ${Object.keys(data[0]).join(', ')}`);
    } else {
        console.log('⚠️ Bảng admin_activity_logs trống.');
        // Thử lấy danh sách cột từ rpc nếu có hoặc đoán
        console.log('   Dựa trên code, có vẻ là admin_user_name');
    }
}

checkLogsTable();
