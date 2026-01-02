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
    // --- Template Logic ---
    if (templateName === 'invite') {
      subject = `Chào mừng ${templateData.name} đến với 1Beauty.asia!`;
      // Embedded template to avoid file path issues in Edge Functions
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #E6A4B4; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chào mừng đến với 1Beauty!</h1>
        </div>
        <div class="content">
            <p>Xin chào {{name}},</p>
            <p>Yêu cầu đăng ký đối tác của bạn đã được chấp thuận! Chúng tôi rất vui mừng được chào đón bạn gia nhập cộng đồng.</p>
            <p>Vui lòng nhấn vào nút bên dưới để hoàn tất thiết lập tài khoản và bắt đầu quản lý hồ sơ doanh nghiệp của bạn:</p>
            <p style="text-align: center;">
                <a href="{{action_url}}" class="button">Hoàn tất đăng ký</a>
            </p>
            <p>Nếu nút trên không hoạt động, hãy copy đường dẫn sau vào trình duyệt:</p>
            <p>{{action_url}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;
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