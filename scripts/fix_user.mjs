import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixUser(email, newPassword) {
    console.log(`Fixing user: ${email}`);

    // 1. Get user ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`User ${email} not found in Auth.`);
        return;
    }

    console.log(`Found Auth User ID: ${user.id}`);

    // 2. Reset password to something VERY simple
    const { error: resetError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
    if (resetError) {
        console.error("Reset Error:", resetError.message);
    } else {
        console.log(`Password reset to: ${newPassword}`);
    }

    // 3. Check for profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (profileError) {
        console.error("Profile Error:", profileError.message);
    } else if (!profile) {
        console.log("Profile MISSING. Creating one...");
        const { error: insError } = await supabase.from('profiles').insert({
            id: user.id,
            email: email,
            full_name: 'Super Admin',
            user_type: 'admin'
        });
        if (insError) console.error("Create Profile Error:", insError.message);
        else console.log("Profile created.");
    } else {
        console.log("Profile exists:", JSON.stringify(profile, null, 2));
        // Ensure user_type is admin
        if (profile.user_type !== 'admin') {
            console.log("Updating profile user_type to admin...");
            await supabase.from('profiles').update({ user_type: 'admin' }).eq('id', user.id);
        }
    }

    // 4. Check admin_users again
    const { data: adminUser } = await supabase.from('admin_users').select('*').eq('email', email).maybeSingle();
    if (!adminUser) {
        console.log("Adding to admin_users table...");
        await supabase.from('admin_users').insert({
            email: email,
            admin_username: 'SuperAdmin',
            role: 'Admin',
            permissions: { all: true }
        });
    } else {
        console.log("Admin user entry found:", JSON.stringify(adminUser, null, 2));
    }
}

fixUser('tanloifmc@yahoo.com', 'Beauty123456');
