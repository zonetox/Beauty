// supabase/functions/invite-staff/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

// CORS headers for security - only allow specific origins
function getCorsHeaders(origin: string | null) {
  // Allowed origins from env or fallback to production domain
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
    'https://1beauty.asia',
    'https://beauty-red.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]; // Default to first allowed origin (production)
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function createErrorResponse(message: string, statusCode: number, origin: string | null, code?: string): Response {
  const corsHeaders = getCorsHeaders(origin);
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

interface InviteStaffRequestBody {
  email: string;
  businessId: number;
  role: 'Editor' | 'Admin';
  permissions: {
    canEditLandingPage?: boolean;
    canEditBlog?: boolean;
    canManageMedia?: boolean;
    canManageServices?: boolean;
  };
  businessName?: string; // For email template
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request
    const { email, businessId, role, permissions, businessName }: InviteStaffRequestBody = await req.json();
    
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse('Invalid email address', 400, req.headers.get('origin'), 'VALIDATION_ERROR');
    }

    if (!businessId || typeof businessId !== 'number') {
      return createErrorResponse('Invalid business ID', 400, req.headers.get('origin'), 'VALIDATION_ERROR');
    }

    if (!role || (role !== 'Editor' && role !== 'Admin')) {
      return createErrorResponse('Invalid role. Must be Editor or Admin', 400, req.headers.get('origin'), 'VALIDATION_ERROR');
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SECRET_KEY') ?? 
      Deno.env.get('SUPABASE_SECRET') ?? 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Check if business exists
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return createErrorResponse(`Business with ID ${businessId} not found`, 404, req.headers.get('origin'), 'BUSINESS_NOT_FOUND');
    }

    // 2. Check if user already exists
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      // User already exists, use their ID
      userId = existingProfile.id;
    } else {
      // User doesn't exist, invite them via Supabase Auth
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: email.split('@')[0], // Use email prefix as default name
          },
        }
      );

      if (inviteError || !inviteData || !inviteData.user) {
        return createErrorResponse(`Failed to invite user: ${inviteError?.message || 'Unknown error'}`, 500, req.headers.get('origin'), 'INVITE_ERROR');
      }

      userId = inviteData.user.id;
      isNewUser = true;

      // Create profile for new user
      const { error: profileCreateError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          business_id: null, // Staff members don't own the business
        });

      if (profileCreateError) {
        // Rollback: delete user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return createErrorResponse(`Failed to create profile: ${profileCreateError.message}`, 500, req.headers.get('origin'), 'PROFILE_ERROR');
      }

      // Send invitation email if new user
      if (inviteData.user.action_link) {
        const { error: emailError } = await supabaseAdmin.functions.invoke('send-templated-email', {
          body: {
            to: email,
            templateName: 'invite',
            templateData: {
              name: email.split('@')[0],
              action_url: inviteData.user.action_link,
              business_name: businessName || business.name,
            }
          }
        });

        if (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Don't fail the whole operation if email fails
        }
      }
    }

    // 3. Check if user is already a staff member for this business
    const { data: existingStaff, error: staffCheckError } = await supabaseAdmin
      .from('business_staff')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingStaff) {
      return createErrorResponse('This user is already a staff member for this business', 400, req.headers.get('origin'), 'ALREADY_STAFF');
    }

    // 4. Add staff member to business_staff table
    const { data: newStaff, error: staffError } = await supabaseAdmin
      .from('business_staff')
      .insert({
        business_id: businessId,
        user_id: userId,
        role: role,
        permissions: permissions || {},
      })
      .select()
      .single();

    if (staffError || !newStaff) {
      return createErrorResponse(`Failed to add staff member: ${staffError?.message || 'Unknown error'}`, 500, req.headers.get('origin'), 'STAFF_ERROR');
    }

    return new Response(JSON.stringify({ 
      message: isNewUser 
        ? 'Staff member invited successfully. Invitation email sent.' 
        : 'Staff member added successfully.',
      staff: newStaff,
      isNewUser
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return createErrorResponse(error.message || 'An unexpected error occurred', 500, req.headers.get('origin'), 'INTERNAL_ERROR');
  }
});
