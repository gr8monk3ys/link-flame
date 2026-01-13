/**
 * Email Service - Resend Integration
 *
 * Provides email sending functionality for:
 * - Order confirmations
 * - Newsletter subscription confirmations
 * - Contact form notifications
 *
 * @requires RESEND_API_KEY environment variable
 * @see https://resend.com/docs
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default sender email (must be verified domain in Resend)
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@linkflame.com';

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return resend !== null && !!process.env.RESEND_API_KEY;
}

/**
 * Send order confirmation email
 *
 * @param to - Customer email address
 * @param orderDetails - Order information
 */
export async function sendOrderConfirmation(
  to: string,
  orderDetails: {
    orderId: string;
    items: Array<{ title: string; quantity: number; price: number }>;
    total: number;
    customerName: string;
  }
) {
  if (!resend) {
    console.warn('[EMAIL] Resend not configured - skipping order confirmation email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Order Confirmation - ${orderDetails.orderId}`,
      html: generateOrderConfirmationHTML(orderDetails),
    });

    if (error) {
      console.error('[EMAIL] Failed to send order confirmation:', error);
      return { success: false, error };
    }

    console.log('[EMAIL] Order confirmation sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL] Error sending order confirmation:', error);
    return { success: false, error };
  }
}

/**
 * Send newsletter subscription confirmation
 *
 * @param to - Subscriber email address
 */
export async function sendNewsletterConfirmation(to: string) {
  if (!resend) {
    console.warn('[EMAIL] Resend not configured - skipping newsletter confirmation');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to Link Flame Newsletter! 🌱',
      html: generateNewsletterConfirmationHTML(to),
    });

    if (error) {
      console.error('[EMAIL] Failed to send newsletter confirmation:', error);
      return { success: false, error };
    }

    console.log('[EMAIL] Newsletter confirmation sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL] Error sending newsletter confirmation:', error);
    return { success: false, error };
  }
}

/**
 * Send contact form notification to admin
 *
 * @param contactData - Form submission data
 */
export async function sendContactNotification(contactData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!resend) {
    console.warn('[EMAIL] Resend not configured - skipping contact notification');
    return { success: false, error: 'Email service not configured' };
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@linkflame.com';

  try {
    // Send notification to admin
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      replyTo: contactData.email,
      subject: `New Contact Form: ${contactData.subject}`,
      html: generateContactNotificationHTML(contactData),
    });

    if (error) {
      console.error('[EMAIL] Failed to send contact notification:', error);
      return { success: false, error };
    }

    // Send confirmation to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: contactData.email,
      subject: 'We received your message - Link Flame',
      html: generateContactConfirmationHTML(contactData),
    });

    console.log('[EMAIL] Contact notification sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL] Error sending contact notification:', error);
    return { success: false, error };
  }
}

/**
 * Generate order confirmation HTML
 */
function generateOrderConfirmationHTML(orderDetails: {
  orderId: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  total: number;
  customerName: string;
}): string {
  const itemsHTML = orderDetails.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.title}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🌱 Link Flame</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Eco-friendly living made simple</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Thank you for your order!</h2>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              Hi ${orderDetails.customerName},
            </p>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              We've received your order and it's being processed. Here are the details:
            </p>

            <!-- Order ID -->
            <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Order ID</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #1f2937;">${orderDetails.orderId}</p>
            </div>

            <!-- Order Items -->
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #6b7280; font-size: 14px;">Product</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #6b7280; font-size: 14px;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280; font-size: 14px;">Price</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280; font-size: 14px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 16px 12px 12px 12px; text-align: right; font-weight: 600; font-size: 16px; color: #1f2937;">Total:</td>
                  <td style="padding: 16px 12px 12px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #10b981;">$${orderDetails.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              We'll send you another email once your order ships with tracking information.
            </p>

            <p style="margin: 0 0 8px 0; font-size: 16px;">
              Thank you for supporting sustainable living! 🌍
            </p>

            <p style="margin: 0; font-size: 16px;">
              The Link Flame Team
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
              Questions? Contact us at support@linkflame.com
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              © 2026 Link Flame. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate newsletter confirmation HTML
 */
function generateNewsletterConfirmationHTML(email: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🌱 Welcome to Link Flame!</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Thank you for subscribing!</h2>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              You've successfully subscribed to our newsletter at <strong>${email}</strong>.
            </p>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              You'll now receive updates about:
            </p>

            <ul style="margin: 0 0 24px 0; padding-left: 24px;">
              <li style="margin: 0 0 8px 0; font-size: 16px;">🌍 Eco-friendly product launches</li>
              <li style="margin: 0 0 8px 0; font-size: 16px;">♻️ Sustainable living tips</li>
              <li style="margin: 0 0 8px 0; font-size: 16px;">🎁 Exclusive offers and discounts</li>
              <li style="margin: 0; font-size: 16px;">📰 Community stories and news</li>
            </ul>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              Together, we're making a difference for our planet!
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Explore Products
              </a>
            </div>

            <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
              You can unsubscribe at any time by clicking the unsubscribe link in any email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              © 2026 Link Flame. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate contact notification HTML (for admin)
 */
function generateContactNotificationHTML(contactData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background-color: #1f2937; padding: 24px 30px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">📧 New Contact Form Submission</h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <div style="margin: 0 0 16px 0;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280; font-weight: 600;">From:</p>
              <p style="margin: 0; font-size: 16px; color: #1f2937;">${contactData.name} (${contactData.email})</p>
            </div>

            <div style="margin: 0 0 24px 0;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Subject:</p>
              <p style="margin: 0; font-size: 16px; color: #1f2937;">${contactData.subject}</p>
            </div>

            <div style="margin: 0 0 24px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Message:</p>
              <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: #1f2937; white-space: pre-wrap;">${contactData.message}</p>
              </div>
            </div>

            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Reply to this email to respond directly to ${contactData.name}.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 16px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              Link Flame Contact Form Notification
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate contact confirmation HTML (for user)
 */
function generateContactConfirmationHTML(contactData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Message Received! ✓</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">
              Hi ${contactData.name},
            </p>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              Thank you for contacting Link Flame! We've received your message about "<strong>${contactData.subject}</strong>" and our team will get back to you within 24-48 hours.
            </p>

            <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Your message:</p>
              <p style="margin: 0; font-size: 14px; color: #1f2937; white-space: pre-wrap;">${contactData.message}</p>
            </div>

            <p style="margin: 0 0 8px 0; font-size: 16px;">
              Best regards,
            </p>
            <p style="margin: 0; font-size: 16px;">
              The Link Flame Team 🌱
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
              Visit our website: <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}" style="color: #10b981; text-decoration: none;">linkflame.com</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              © 2026 Link Flame. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
