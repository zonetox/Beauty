import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function resetAdminPassword(email, newPassword) {
    console.log(`Searching for user with email: ${email}...`);

    // 1. Find user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("Error listing users:", listError.message);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    console.log(`User found with ID: ${user.id}. Resetting password...`);

    // 2. Update password
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (updateError) {
        console.error("Error updating password:", updateError.message);
        return;
    }

    console.log(`Successfully reset password for ${email}.`);
    console.log(`New temporary password: ${newPassword}`);
}

const email = 'tanloifmc@yahoo.com';
const newPass = 'Beauty' + Math.floor(1000 + Math.random() * 9000) + '!';

resetAdminPassword(email, newPass);
