// supabase/functions/send-email/index.ts
// The 'Deno' global is available in the Supabase Edge Function runtime.
// An explicit declaration is sometimes necessary to resolve TypeScript errors.

// Fix: Declare Deno to make it available in the TS context.
declare const Deno: any;

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// Define CORS headers for security. This allows your web app to call the function.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// Fix: Add explicit Request type for the handler's parameter for better type safety.
Deno.serve(async (req: Request) => {
  // Handle the preflight CORS request, which is essential for browser security.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Safely parse the JSON body from the request.
    const { to, subject, html } = await req.json();

    // Validate that all required fields are present.
    if (!to || !subject || !html) {
        throw new Error("Missing required fields: to, subject, html");
    }

    // Call the Resend API to send the email.
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        // Use a professional 'from' address.
        // NOTE: This domain must be verified in your Resend account.
        from: '1Beauty Asia <noreply@1beauty.asia>',
        to,
        subject,
        html
      })
    });

    const data = await res.json();

    // Check if the Resend API call was successful.
    if (!res.ok) {
        console.error("Resend API Error:", data);
        throw new Error(data.message || "Failed to send email");
    }

    // Return the successful response, including CORS headers.
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) { // Fix: Add explicit type for the catch clause variable to align with modern TypeScript standards.
    // Handle any errors that occur during the process and return a helpful message.
    return createErrorResponse(error.message || 'An unexpected error occurred', 400, 'BAD_REQUEST');
  }
});