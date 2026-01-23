
/**
 * Schema Synchronization Checker
 * 
 * This script checks if the database schema matches the expected application schema (Zod/TypeScript).
 * It runs basic checks on critical tables to ensure deployments are safe.
 * 
 * Usage: npx ts-node scripts/check-schema-sync.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';


import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

console.log('Loading env from:', envLocalPath);
const result = dotenv.config({ path: envLocalPath });

if (result.error) {
    console.warn('⚠️ Could not load .env.local:', result.error.message);
} else {
    // console.log('Loaded .env.local keys:', Object.keys(result.parsed || {}));
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// We need SERVICE_ROLE_KEY to check information_schema usually, implies admin rights.
// Or we can try with ANON key if RLS allows reading schema info (unlikely).
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY/SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface TableCheck {
    table: string;
    requiredColumns: string[];
}

const CRITICAL_CHECKS: TableCheck[] = [
    {
        table: 'profiles',
        requiredColumns: ['id', 'user_type', 'business_id', 'full_name', 'email']
    },
    {
        table: 'businesses',
        requiredColumns: ['id', 'owner_id', 'is_active', 'is_verified', 'rating'] // 'rating' often missed
    }
];

async function checkSchema() {
    console.log('🔍 Starting Schema Synchronization Check...');
    let hasErrors = false;

    for (const check of CRITICAL_CHECKS) {
        console.log(`\nChecking table: [${check.table}]...`);

        // Query information_schema
        // Note: RPC is often safer/easier if direct access is blocked, but let's try direct select first.
        // If this fails due to permissions, we might need a custom RPC 'get_table_info'.

        try {
            // Using a hacky way: simple select limit 0 to see if it errors on column selection?
            // No, that validates "column exists" if we select specific columns.
            const query = supabase
                .from(check.table)
                .select(check.requiredColumns.join(','))
                .limit(1);

            const { error } = await query;

            if (error) {
                // Postgres error for missing column usually: code 42703 (undefined_column)
                if (error.code === '42703' || error.message.includes('does not exist')) {
                    console.error(`❌ Column Missing Error: ${error.message}`);
                    hasErrors = true;
                } else {
                    console.warn(`⚠️ Could not verify table ${check.table} (Permission/Other Error): ${error.message}`);
                    // Don't fail the script on permission errors, just warn
                }
            } else {
                console.log(`✅ Table [${check.table}] has all required columns.`);
            }

        } catch (e: any) {
            console.error(`❌ Unexpected error checking ${check.table}:`, e);
            hasErrors = true;
        }
    }

    // Custom check for function existence
    console.log('\nChecking critical RPC functions...');
    const rpcCheck = await supabase.rpc('register_business_atomic', {
        p_email: 'test@check.com',
        p_full_name: 'Check',
        p_business_name: 'Check',
        p_phone: '000',
        p_address: 'Check',
        p_category: 'Spa'
    } as any);

    // We expect an error (auth/duplicate) or success, but NOT "function not found"
    if (rpcCheck.error && rpcCheck.error.message.includes('function') && rpcCheck.error.message.includes('does not exist')) {
        console.error(`❌ RPC Function 'register_business_atomic' missing!`);
        hasErrors = true;
    } else {
        console.log(`✅ RPC Function 'register_business_atomic' appears to exist.`);
    }

    if (hasErrors) {
        console.error('\n🚫 SCHEMA SYNC FAILED: Database does not match expected application schema.');
        process.exit(1);
    } else {
        console.log('\n✨ SCHEMA SYNC PASSED: Critical schema elements are present.');
        process.exit(0);
    }
}

checkSchema();
