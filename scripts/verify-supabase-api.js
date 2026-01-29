
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
    console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_KEY trong .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    console.log('🚀 Đang kiểm tra Database qua Supabase API...');
    console.log(`URL: ${supabaseUrl}`);

    const targetTables = [
        'businesses',
        'membership_packages',
        'blog_categories',
        'page_views',
        'conversions',
        'business_staff',
        'abuse_reports'
    ];

    for (const table of targetTables) {
        try {
            const { data, error, status } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    console.log(`❌ [${table}]: KHÔNG TỒN TẠI trên DB Live (Error: ${error.message})`);
                } else {
                    console.log(`⚠️ [${table}]: Có lỗi khác (${error.code}) - ${error.message}`);
                }
            } else {
                console.log(`✅ [${table}]: ĐÃ TỒN TẠI (Found ${data?.length || 0} records, Status: ${status})`);
            }
        } catch (err) {
            console.log(`❌ [${table}]: Lỗi hệ thống - ${err.message}`);
        }
    }

    // Kiểm tra cột status trong blog_posts
    console.log('\n🔍 Kiểm tra cột [status] trong blog_posts...');
    const { data: blogData, error: blogError } = await supabase
        .from('blog_posts')
        .select('status')
        .limit(1);

    if (blogError) {
        if (blogError.message?.includes('column "status" does not exist')) {
            console.log('❌ Cột [status] KHÔNG TỒN TẠI trong blog_posts trên DB Live');
        } else {
            console.log('⚠️  Lỗi khi kiểm tra cột status:', blogError.message);
        }
    } else {
        console.log('✅ Cột [status] ĐÃ TỒN TẠI trong blog_posts trên DB Live');
    }
}

verifyTables();
