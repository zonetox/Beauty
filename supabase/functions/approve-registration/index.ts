// supabase/functions/approve-registration/index.ts
import { createClient } from '@supabase/supabase-js';

// Fix: Declare the Deno global object to satisfy TypeScript in environments where Deno types are not globally available.
declare const Deno: any;

// CORS headers for security.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define a type for the expected request body for clarity.
interface ApproveRequestBody {
  requestId: string;
}

Deno.serve(async (req: Request) => {
  // Handle preflight CORS request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { requestId }: ApproveRequestBody = await req.json();
    if (!requestId) {
      throw new Error("Request ID is required.");
    }

    // Initialize Supabase admin client to perform privileged operations.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
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
    const slug = request.business_name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`;
    const { data: newBusiness, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: request.business_name,
        email: request.email,
        phone: request.phone,
        address: request.address,
        categories: [request.category],
        membership_tier: request.tier,
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

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});