// supabase/functions/approve-registration/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};

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

// PHASE 2: Standardized error response helper
// Helper function to create standardized error responses
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

// Define a type for the expected request body for clarity.
interface ApproveRequestBody {
  requestId: string;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle preflight CORS request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // PHASE 1 FIX: Input validation
    const { requestId }: ApproveRequestBody = await req.json();

    // Validate requestId
    if (!requestId || typeof requestId !== 'string' || requestId.trim().length === 0) {
      return createErrorResponse('Invalid request ID. Request ID is required and must be a non-empty string.', 400, req.headers.get('origin'), 'VALIDATION_ERROR');
    }

    // Validate UUID format (requestId should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      return createErrorResponse('Invalid request ID format. Must be a valid UUID.', 400, req.headers.get('origin'), 'VALIDATION_ERROR');
    }

    // Initialize Supabase admin client to perform privileged operations.
    // Priority: Use new SECRET_KEY if available, fallback to SUPABASE_SERVICE_ROLE_KEY (reserved)
    // Note: Supabase doesn't allow secrets with SUPABASE_ prefix, so we use SECRET_KEY
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SECRET_KEY') ??
      Deno.env.get('SUPABASE_SECRET') ??
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch the registration request from the database.
    const { data: request, error: requestError } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error(`Registration request with ID ${requestId} not found.`);
    }

    if (request.status === 'Approved') {
      return new Response(JSON.stringify({ message: "Request already approved." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Create a new business record based on the request.
    // TRIAL LOGIC: Always start with Premium tier, 30 days trial (ignore requested tier)
    const slug = request.business_name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`;

    // Calculate trial expiry date (30 days from now)
    const trialExpiryDate = new Date();
    trialExpiryDate.setDate(trialExpiryDate.getDate() + 30);

    const { data: newBusiness, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: request.business_name,
        email: request.email,
        phone: request.phone,
        address: request.address || '',
        categories: [request.category],
        // TRIAL: Always Premium, 30 days (ignore request.tier)
        membership_tier: 'Premium',
        membership_expiry_date: trialExpiryDate.toISOString(),
        slug: slug,
        // Default values for a new business
        is_active: true,
        is_verified: false,
        rating: 0,
        review_count: 0,
        view_count: 0,
        // image_url is required (NOT NULL in schema)
        // Business owner can upload logo via business dashboard after first login
        // Using a default business placeholder image URL that can be replaced later
        image_url: `https://via.placeholder.com/400x300/E6A4B4/FFFFFF?text=${encodeURIComponent(request.business_name.substring(0, 20))}`,
        joined_date: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (businessError || !newBusiness) {
      throw new Error(`Failed to create business: ${businessError?.message}`);
    }

    // 3. Invite the user to get the invitation link.
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      request.email,
      {
        data: {
          full_name: request.business_name,
        },
      }
    );

    if (inviteError || !inviteData || !inviteData.user) {
      await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
      throw new Error(`Failed to invite user: ${inviteError?.message}`);
    }

    const invitationLink = inviteData.user.action_link;
    if (!invitationLink) {
      throw new Error("Could not retrieve invitation link.");
    }

    // 3.5 Send the templated email with the invitation link
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-templated-email', {
      body: {
        to: request.email,
        templateName: 'invite',
        templateData: {
          name: request.business_name,
          action_url: invitationLink
        }
      }
    });

    if (emailError) {
      // Rollback if email fails
      await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
      await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id);
      throw new Error(`Failed to send templated email: ${emailError.message}`);
    }

    const newUserId = inviteData.user.id;

    // 4. Update business.owner_id to link ownership
    const { error: ownerUpdateError } = await supabaseAdmin
      .from('businesses')
      .update({ owner_id: newUserId })
      .eq('id', newBusiness.id);

    if (ownerUpdateError) {
      // Roll back previous steps if owner update fails
      await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed to set business ownership: ${ownerUpdateError.message}`);
    }

    // 5. Create a corresponding profile in the public.profiles table.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        full_name: request.business_name,
        email: request.email,
        business_id: newBusiness.id, // Link the profile to the new business
      });

    if (profileError) {
      // Roll back previous steps if profile creation fails
      await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    // 6. Update the registration request status to 'Approved'.
    const { error: updateRequestError } = await supabaseAdmin
      .from('registration_requests')
      .update({ status: 'Approved' })
      .eq('id', requestId);

    if (updateRequestError) {
      console.error("Failed to update request status, but user and business were created.", updateRequestError);
    }

    return new Response(JSON.stringify({ message: 'Business approved and invitation sent successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    return createErrorResponse(error instanceof Error ? error.message : 'An unexpected error occurred', 500, req.headers.get('origin'), 'INTERNAL_ERROR');
  }
});