// supabase/functions/create-admin-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Note: In a real-world scenario, you'd add another layer of security here
    // to ensure only an existing admin can call this function.
    // This could be done by checking the JWT from the request headers.

    const { email, password, username, role, permissions } = await req.json();

    if (!email || !password || !username || !role || !permissions) {
      throw new Error("Missing required fields for admin creation.");
    }

    // Priority: Use new SECRET_KEY if available, fallback to SUPABASE_SERVICE_ROLE_KEY (reserved)
    // Note: Supabase doesn't allow secrets with SUPABASE_ prefix, so we use SECRET_KEY
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SECRET_KEY') ?? 
      Deno.env.get('SUPABASE_SECRET') ?? 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Create the user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm the email for admins
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    // 2. Insert the user profile into public.admin_users
    const { error: profileError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        username: username,
        email: email,
        role: role,
        permissions: permissions,
        is_locked: false,
      });

    if (profileError) {
      // If creating the profile fails, roll back by deleting the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create admin profile: ${profileError.message}`);
    }

    return new Response(JSON.stringify({ message: 'Admin user created successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});