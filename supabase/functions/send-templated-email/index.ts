// supabase/functions/send-templated-email/index.ts
// E1 Email System - Tuân thủ Master Plan v1.1
declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Promise<Response>): void;
};

import { Resend } from "resend";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const resend = new Resend(RESEND_API_KEY);

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

interface TemplateData {
    [key: string]: string | number | boolean;
}

/**
 * Get email template HTML
 */
function getEmailTemplate(templateName: string, templateData: TemplateData): { subject: string; html: string } {
    const baseStyles = `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #E6A4B4 0%, #C86B85 100%); padding: 30px 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #E6A4B4; color: white; text-decoration: none; border-radius: 5px; font-weight: 600; margin: 20px 0; }
    .button:hover { background-color: #C86B85; }
    .footer { text-align: center; font-size: 12px; color: #666; padding: 20px; background-color: #f8f9fa; }
    .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #555; }
    .info-value { color: #333; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px 15px !important; }
    }
  `;

    let subject = '';
    let htmlContent = '';

    switch (templateName) {
        case 'invite':
            subject = `Chào mừng ${templateData.name || 'bạn'} đến với 1Beauty.asia!`;
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chào mừng đến với 1Beauty!</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>{{name}}</strong>,</p>
            <p>Yêu cầu đăng ký đối tác của bạn đã được chấp thuận! Chúng tôi rất vui mừng được chào đón bạn gia nhập cộng đồng 1Beauty.asia.</p>
            <p>Vui lòng nhấn vào nút bên dưới để hoàn tất thiết lập tài khoản và bắt đầu quản lý hồ sơ doanh nghiệp của bạn:</p>
            <p style="text-align: center;">
                <a href="{{action_url}}" class="button">Hoàn tất đăng ký</a>
            </p>
            <p>Nếu nút trên không hoạt động, hãy copy đường dẫn sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #E6A4B4;">{{action_url}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;

        case 'welcome':
            subject = 'Chào mừng bạn đến với 1Beauty.asia!';
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chào mừng bạn!</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>{{name}}</strong>,</p>
            <p>Cảm ơn bạn đã tham gia cộng đồng 1Beauty.asia! Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình làm đẹp.</p>
            <p>Với 1Beauty.asia, bạn có thể:</p>
            <ul>
                <li>Khám phá hàng ngàn spa, salon và clinic uy tín</li>
                <li>Đặt lịch hẹn dễ dàng và nhanh chóng</li>
                <li>Nhận ưu đãi độc quyền từ các đối tác</li>
                <li>Đọc và chia sẻ đánh giá thực tế</li>
            </ul>
            <p style="text-align: center;">
                <a href="https://1beauty.asia" class="button">Khám phá ngay</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;

        case 'order_confirmation':
            subject = `Xác nhận đơn hàng #${templateData.orderId || 'N/A'}`;
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Xác nhận đơn hàng</h1>
        </div>
        <div class="content">
            <p>Cảm ơn bạn đã đặt hàng tại 1Beauty.asia!</p>
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Mã đơn hàng:</span>
                    <span class="info-value">#{{orderId}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tổng tiền:</span>
                    <span class="info-value"><strong>{{totalAmount}}</strong></span>
                </div>
            </div>
            <p><strong>Chi tiết đơn hàng:</strong></p>
            <div class="info-box">
                {{orderDetails}}
            </div>
            <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất. Bạn sẽ nhận được thông báo khi đơn hàng được xác nhận.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;

        case 'booking_confirmation':
            subject = `Xác nhận lịch hẹn tại ${templateData.businessName || 'đối tác'}`;
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Xác nhận lịch hẹn</h1>
        </div>
        <div class="content">
            <p>Lịch hẹn của bạn đã được xác nhận!</p>
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Đối tác:</span>
                    <span class="info-value"><strong>{{businessName}}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Dịch vụ:</span>
                    <span class="info-value">{{serviceName}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ngày:</span>
                    <span class="info-value">{{appointmentDate}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Giờ:</span>
                    <span class="info-value">{{appointmentTime}}</span>
                </div>
            </div>
            <p>Vui lòng đến đúng giờ hẹn. Nếu có thay đổi, vui lòng liên hệ với đối tác trước 24 giờ.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;

        case 'booking_cancelled':
            subject = `Hủy lịch hẹn tại ${templateData.businessName || 'đối tác'}`;
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
            <h1>Lịch hẹn đã bị hủy</h1>
        </div>
        <div class="content">
            <p>Chúng tôi xin thông báo lịch hẹn của bạn đã bị hủy.</p>
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Đối tác:</span>
                    <span class="info-value"><strong>{{businessName}}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Dịch vụ:</span>
                    <span class="info-value">{{serviceName}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ngày:</span>
                    <span class="info-value">{{appointmentDate}}</span>
                </div>
            </div>
            <p>Nếu bạn muốn đặt lịch hẹn mới, vui lòng truy cập trang đối tác hoặc liên hệ trực tiếp.</p>
            <p style="text-align: center;">
                <a href="https://1beauty.asia" class="button">Đặt lịch mới</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;

        case 'password_reset':
            subject = 'Đặt lại mật khẩu - 1Beauty.asia';
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Đặt lại mật khẩu</h1>
        </div>
        <div class="content">
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            <p style="text-align: center;">
                <a href="{{reset_url}}" class="button">Đặt lại mật khẩu</a>
            </p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Liên kết này sẽ hết hạn sau 1 giờ.</p>
            <p style="word-break: break-all; color: #E6A4B4; font-size: 12px;">{{reset_url}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;

        case 'membership_expiry':
            subject = `Cảnh báo: Gói thành viên sắp hết hạn`;
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);">
            <h1>Cảnh báo hết hạn</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>{{businessName}}</strong>,</p>
            <p>Gói thành viên <strong>{{membershipTier}}</strong> của bạn sẽ hết hạn vào ngày <strong>{{expiryDate}}</strong>.</p>
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Gói hiện tại:</span>
                    <span class="info-value"><strong>{{membershipTier}}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ngày hết hạn:</span>
                    <span class="info-value">{{expiryDate}}</span>
                </div>
            </div>
            <p>Để tiếp tục sử dụng các tính năng premium, vui lòng gia hạn gói thành viên trước ngày hết hạn.</p>
            <p style="text-align: center;">
                <a href="https://1beauty.asia/dashboard/membership" class="button">Gia hạn ngay</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;

        case 'review_received':
            subject = `Bạn có đánh giá mới từ ${templateData.customerName || 'khách hàng'}`;
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Đánh giá mới</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>{{businessName}}</strong>,</p>
            <p>Bạn có một đánh giá mới từ khách hàng <strong>{{customerName}}</strong>!</p>
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Đánh giá:</span>
                    <span class="info-value">
                        ${Array.from({ length: 5 }, (_, i) =>
                `<span style="color: ${i < parseInt(templateData.rating?.toString() || '0') ? '#ffc107' : '#ddd'}; font-size: 20px;">★</span>`
            ).join('')}
                        <strong>${templateData.rating}/5</strong>
                    </span>
                </div>
            </div>
            <div class="info-box">
                <p><strong>Nội dung đánh giá:</strong></p>
                <p style="font-style: italic; color: #555;">{{reviewText}}</p>
            </div>
            <p>Hãy đăng nhập vào trang quản trị để xem chi tiết và phản hồi đánh giá này.</p>
            <p style="text-align: center;">
                <a href="https://1beauty.asia/dashboard/reviews" class="button">Xem đánh giá</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2024 1Beauty Asia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;

        default:
            throw new Error(`Template '${templateName}' not found.`);
    }

    // Replace placeholders in the template
    for (const key in templateData) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const value = String(templateData[key] || '');
        htmlContent = htmlContent.replace(regex, value);
        subject = subject.replace(regex, value);
    }

    return { subject, html: htmlContent };
}

Deno.serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req.headers.get('origin'));

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { to, templateName, templateData, subject: subjectOverride } = await req.json();

        if (!to || !templateName || !templateData) {
            throw new Error("Missing 'to', 'templateName', or 'templateData'.");
        }

        // Get template
        const { subject, html } = getEmailTemplate(templateName, templateData);
        const finalSubject = subjectOverride || subject;

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: '1Beauty Asia <noreply@1beauty.asia>',
            to: [to],
            subject: finalSubject,
            html: html,
        });

        if (error) {
            console.error("Resend API Error:", error);
            throw new Error(error.message || "Failed to send email");
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        return createErrorResponse(error instanceof Error ? error.message : 'An unexpected error occurred', 400, req.headers.get('origin'), 'BAD_REQUEST');
    }
});
