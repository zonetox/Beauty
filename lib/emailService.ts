/**
 * Email Service
 * Tuân thủ Master Plan v1.1 - E1 Email System
 * Centralized email sending service with database logging
 */

import { supabase } from './supabaseClient';

export interface EmailTemplateData {
  [key: string]: string | number | boolean;
}

export type EmailTemplate =
  | 'invite'
  | 'welcome'
  | 'order_confirmation'
  | 'booking_confirmation'
  | 'booking_cancelled'
  | 'password_reset'
  | 'membership_expiry'
  | 'review_received';

export interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  templateData: EmailTemplateData;
  subject?: string; // Optional override
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using templated email Edge Function
 * Logs email to database for tracking
 */
export async function sendTemplatedEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const { to, template, templateData, subject } = options;

  try {
    // Call Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-templated-email', {
      body: {
        to,
        templateName: template,
        templateData,
        subject, // Optional override
      },
    });

    if (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    const messageId = data?.id || data?.messageId || 'unknown';

    // Log email to database (using service role or admin context)
    // Note: This requires admin context or service role
    try {
      const { error: logError } = await supabase
        .from('email_notifications_log')
        .insert({
          recipient_email: to,
          subject: subject || getDefaultSubject(template, templateData),
          body: JSON.stringify(templateData), // Store template data as JSON
          sent_at: new Date().toISOString(),
          read: false,
        });

      if (logError) {
        console.warn('Failed to log email to database:', logError);
        // Don't fail the email send if logging fails
      }
    } catch (logError) {
      console.warn('Error logging email:', logError);
      // Don't fail the email send if logging fails
    }

    return {
      success: true,
      messageId,
    };
  } catch (error: unknown) {
    console.error('Email service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Send simple email (without template)
 * For custom emails or simple notifications
 */
export async function sendSimpleEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html,
      },
    });

    if (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    const messageId = data?.id || data?.messageId || 'unknown';

    // Log email to database
    try {
      const { error: logError } = await supabase
        .from('email_notifications_log')
        .insert({
          recipient_email: to,
          subject,
          body: html,
          sent_at: new Date().toISOString(),
          read: false,
        });

      if (logError) {
        console.warn('Failed to log email to database:', logError);
      }
    } catch (logError) {
      console.warn('Error logging email:', logError);
    }

    return {
      success: true,
      messageId,
    };
  } catch (error: unknown) {
    console.error('Email service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Get default subject for template
 */
function getDefaultSubject(template: EmailTemplate, templateData: EmailTemplateData): string {
  switch (template) {
    case 'invite':
      return `Chào mừng ${templateData.name || 'bạn'} đến với 1Beauty.asia!`;
    case 'welcome':
      return 'Chào mừng bạn đến với 1Beauty.asia!';
    case 'order_confirmation':
      return `Xác nhận đơn hàng #${templateData.orderId || 'N/A'}`;
    case 'booking_confirmation':
      return `Xác nhận lịch hẹn tại ${templateData.businessName || 'đối tác'}`;
    case 'booking_cancelled':
      return `Hủy lịch hẹn tại ${templateData.businessName || 'đối tác'}`;
    case 'password_reset':
      return 'Đặt lại mật khẩu - 1Beauty.asia';
    case 'membership_expiry':
      return `Cảnh báo: Gói thành viên sắp hết hạn`;
    case 'review_received':
      return `Bạn có đánh giá mới từ ${templateData.customerName || 'khách hàng'}`;
    default:
      return 'Thông báo từ 1Beauty.asia';
  }
}

/**
 * Email trigger helpers
 * These functions are called at various trigger points in the application
 */

export const emailTriggers = {
  /**
   * Send invitation email when business registration is approved
   */
  async sendRegistrationInvite(email: string, name: string, inviteUrl: string) {
    return sendTemplatedEmail({
      to: email,
      template: 'invite',
      templateData: {
        name,
        action_url: inviteUrl,
      },
    });
  },

  /**
   * Send welcome email after first login
   */
  async sendWelcomeEmail(email: string, name: string) {
    return sendTemplatedEmail({
      to: email,
      template: 'welcome',
      templateData: {
        name,
      },
    });
  },

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    email: string,
    orderId: string,
    orderDetails: string,
    totalAmount: string
  ) {
    return sendTemplatedEmail({
      to: email,
      template: 'order_confirmation',
      templateData: {
        orderId,
        orderDetails,
        totalAmount,
      },
    });
  },

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    email: string,
    businessName: string,
    serviceName: string,
    appointmentDate: string,
    appointmentTime: string
  ) {
    return sendTemplatedEmail({
      to: email,
      template: 'booking_confirmation',
      templateData: {
        businessName,
        serviceName,
        appointmentDate,
        appointmentTime,
      },
    });
  },

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(
    email: string,
    businessName: string,
    serviceName: string,
    appointmentDate: string
  ) {
    return sendTemplatedEmail({
      to: email,
      template: 'booking_cancelled',
      templateData: {
        businessName,
        serviceName,
        appointmentDate,
      },
    });
  },

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, resetUrl: string) {
    return sendTemplatedEmail({
      to: email,
      template: 'password_reset',
      templateData: {
        reset_url: resetUrl,
      },
    });
  },

  /**
   * Send membership expiry warning
   */
  async sendMembershipExpiryWarning(
    email: string,
    businessName: string,
    expiryDate: string,
    membership_tier: string
  ) {
    return sendTemplatedEmail({
      to: email,
      template: 'membership_expiry',
      templateData: {
        businessName,
        expiryDate,
        membership_tier,
      },
    });
  },

  /**
   * Send review received notification
   */
  async sendReviewReceivedNotification(
    email: string,
    businessName: string,
    customerName: string,
    rating: number,
    reviewText: string
  ) {
    return sendTemplatedEmail({
      to: email,
      template: 'review_received',
      templateData: {
        businessName,
        customerName,
        rating: rating.toString(),
        reviewText,
      },
    });
  },
};

