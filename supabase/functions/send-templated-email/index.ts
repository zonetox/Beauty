// supabase/functions/send-templated-email/index.ts
declare const Deno: any;

import { Resend } from "https://esm.sh/resend@3.2.0";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TemplateData {
  [key: string]: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, templateName, templateData } = await req.json();
    
    if (!to || !templateName || !templateData) {
        throw new Error("Missing 'to', 'templateName', or 'templateData'.");
    }

    let subject = '';
    let htmlContent = '';

    // --- Template Logic ---
    if (templateName === 'invite') {
        subject = `Chào mừng ${templateData.name} đến với 1Beauty.asia!`;
        const templatePath = './send-templated-email/templates/invite.html';
        htmlContent = await Deno.readTextFile(templatePath);
    } else {
        throw new Error(`Template '${templateName}' not found.`);
    }

    // Replace placeholders in the template
    for (const key in templateData) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, templateData[key]);
    }
    
    const { data, error } = await resend.emails.send({
      from: '1Beauty Asia <noreply@1beauty.asia>',
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
        console.error("Resend API Error:", error);
        throw new Error(error.message || "Failed to send email");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});