// supabase/functions/create-admin-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PHASE 2: Standardized error response helper
// Helper function to create standardized error responses
function createErrorResponse(message: string, statusCode: number, code?: string): Response {
  const errorResponse: { error: string; code?: string; statusCode?: number } = {
    error: message,
    statusCode,
  };
  if (code) {
    errorResponse.code = code;
  }
  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // PHASE 1 FIX: Authorization check - ensure only existing admins can call this function
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized: Missing Authorization header', 401, 'UNAUTHORIZED');
    }

    // Priority: Use new SECRET_KEY if available, fallback to SUPABASE_SERVICE_ROLE_KEY (reserved)
    // Note: Supabase doesn't allow secrets with SUPABASE_ prefix, so we use SECRET_KEY
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SECRET_KEY') ?? 
      Deno.env.get('SUPABASE_SECRET') ?? 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract and verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    
    if (tokenError || !user) {
      return createErrorResponse('Unauthorized: Invalid token', 401, 'UNAUTHORIZED');
    }

    // Verify user is an admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .eq('is_locked', false)
      .single();

    if (adminError || !adminUser) {
      return createErrorResponse('Forbidden: Admin access required', 403, 'FORBIDDEN');
    }

    // PHASE 1 FIX: Input validation
    const { email, password, username, role, permissions } = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    // Validate password
    if (!password || password.length < 8) {
      return createErrorResponse('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    // Validate username
    if (!username || username.length < 3) {
      return createErrorResponse('Username must be at least 3 characters', 400, 'VALIDATION_ERROR');
    }

    // Validate role
    const validRoles = ['Admin', 'Moderator', 'Editor'];
    if (!role || !validRoles.includes(role)) {
      return createErrorResponse(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    // Validate permissions
    if (!permissions || typeof permissions !== 'object') {
      return createErrorResponse('Permissions must be an object', 400, 'VALIDATION_ERROR');
    }

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
    return createErrorResponse(error.message || 'An unexpected error occurred', 500, 'INTERNAL_ERROR');
  }
});