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
import { logger } from '@/lib/logger';
import { getBaseUrl } from '@/lib/url';

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
    logger.warn('Resend not configured - skipping order confirmation email');
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
      logger.error('Failed to send order confirmation', error);
      return { success: false, error };
    }

    logger.info('Order confirmation sent', { to, orderId: orderDetails.orderId });
    return { success: true, data };
  } catch (error) {
    logger.error('Error sending order confirmation', error);
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
    logger.warn('Resend not configured - skipping newsletter confirmation');
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
      logger.error('Failed to send newsletter confirmation', error);
      return { success: false, error };
    }

    logger.info('Newsletter confirmation sent', { to });
    return { success: true, data };
  } catch (error) {
    logger.error('Error sending newsletter confirmation', error);
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
    logger.warn('Resend not configured - skipping contact notification');
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
      logger.error('Failed to send contact notification', error);
      return { success: false, error };
    }

    // Send confirmation to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: contactData.email,
      subject: 'We received your message - Link Flame',
      html: generateContactConfirmationHTML(contactData),
    });

    logger.info('Contact notification sent', { from: contactData.email, subject: contactData.subject });
    return { success: true, data };
  } catch (error) {
    logger.error('Error sending contact notification', error);
    return { success: false, error };
  }
}

/**
 * Send password reset email
 *
 * @param to - User email address
 * @param resetToken - The plaintext reset token (will be included in URL)
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!resend) {
    logger.warn('Resend not configured - skipping password reset email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resetUrl = `${getBaseUrl()}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Your Password - Link Flame',
      html: generatePasswordResetHTML(resetUrl),
    });

    if (error) {
      logger.error('Failed to send password reset email', error);
      return { success: false, error };
    }

    logger.info('Password reset email sent', { to });
    return { success: true };
  } catch (error) {
    logger.error('Error sending password reset email', error);
    return { success: false, error };
  }
}

/**
 * Send shipping notification email
 *
 * @param to - Customer email address
 * @param orderDetails - Shipping information
 */
export async function sendShippingNotificationEmail(
  to: string,
  orderDetails: {
    orderId: string;
    customerName: string;
    trackingNumber?: string | null;
    shippingCarrier?: string | null;
    estimatedDelivery?: string | null;
  }
): Promise<{ success: boolean; error?: unknown }> {
  if (!resend) {
    logger.warn('Resend not configured - skipping shipping notification email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your Order Has Shipped! - Link Flame',
      html: generateShippingNotificationHTML(orderDetails),
    });

    if (error) {
      logger.error('Failed to send shipping notification', error);
      return { success: false, error };
    }

    logger.info('Shipping notification sent', { to, orderId: orderDetails.orderId });
    return { success: true };
  } catch (error) {
    logger.error('Error sending shipping notification', error);
    return { success: false, error };
  }
}

/**
 * Generate shipping notification HTML email
 */
function generateShippingNotificationHTML(orderDetails: {
  orderId: string;
  customerName: string;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
  estimatedDelivery?: string | null;
}): string {
  const carrierTrackingUrls: Record<string, string> = {
    ups: 'https://www.ups.com/track?tracknum=',
    usps: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
    fedex: 'https://www.fedex.com/fedextrack/?trknbr=',
    dhl: 'https://www.dhl.com/us-en/home/tracking/tracking-global-forwarding.html?submit=1&tracking-id=',
  };

  let trackingHTML = '';
  if (orderDetails.trackingNumber) {
    const normalizedCarrier = (orderDetails.shippingCarrier || '').toLowerCase().replace(/[^a-z]/g, '');
    const trackingBaseUrl = carrierTrackingUrls[normalizedCarrier];
    const carrierLabel = orderDetails.shippingCarrier || 'Carrier';

    if (trackingBaseUrl) {
      const trackingUrl = `${trackingBaseUrl}${orderDetails.trackingNumber}`;
      trackingHTML = `
        <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Carrier</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${carrierLabel}</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Tracking Number</p>
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${orderDetails.trackingNumber}</p>
          <div style="text-align: center;">
            <a href="${trackingUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Track Your Package
            </a>
          </div>
        </div>
      `;
    } else {
      trackingHTML = `
        <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Carrier</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${carrierLabel}</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Tracking Number</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${orderDetails.trackingNumber}</p>
        </div>
      `;
    }
  }

  let estimatedDeliveryHTML = '';
  if (orderDetails.estimatedDelivery) {
    estimatedDeliveryHTML = `
      <div style="background-color: #ecfdf5; padding: 16px; margin: 0 0 24px 0; border-radius: 6px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Estimated Delivery</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #059669;">${orderDetails.estimatedDelivery}</p>
      </div>
    `;
  }

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
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Link Flame</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your Order Has Shipped!</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">
              Hi ${orderDetails.customerName},
            </p>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              Great news! Your order has been shipped and is on its way to you.
            </p>

            <!-- Order ID -->
            <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Order ID</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #1f2937;">${orderDetails.orderId}</p>
            </div>

            <!-- Tracking Info -->
            ${trackingHTML}

            <!-- Estimated Delivery -->
            ${estimatedDeliveryHTML}

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              You can track your order at any time by visiting your account page.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${getBaseUrl()}/account/orders/${orderDetails.orderId}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                View Order Details
              </a>
            </div>

            <p style="margin: 0 0 8px 0; font-size: 16px;">
              Thank you for supporting sustainable living!
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
              &copy; 2026 Link Flame. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send out-of-stock refund notification email
 *
 * @param to - Customer email address
 * @param orderId - The order ID that was refunded
 * @param customerName - Customer display name
 */
export async function sendOutOfStockRefundEmail(
  to: string,
  orderId: string,
  customerName: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!resend) {
    logger.warn('Resend not configured - skipping out-of-stock refund email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your Order Has Been Refunded - Link Flame',
      html: generateOutOfStockRefundHTML(orderId, customerName),
    });

    if (error) {
      logger.error('Failed to send out-of-stock refund email', error);
      return { success: false, error };
    }

    logger.info('Out-of-stock refund email sent', { to, orderId });
    return { success: true };
  } catch (error) {
    logger.error('Error sending out-of-stock refund email', error);
    return { success: false, error };
  }
}

/**
 * Generate out-of-stock refund notification HTML email
 */
function generateOutOfStockRefundHTML(orderId: string, customerName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Link Flame</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Order Refund Notification</p>
          </div>
          <div style="padding: 40px 30px;">
            <p>Hi ${customerName},</p>
            <p>We're sorry, but one or more items in your order <strong>${orderId}</strong> went out of stock between checkout and payment processing.</p>
            <p>A <strong>full refund</strong> has been automatically issued to your original payment method. Please allow 5-10 business days for the refund to appear.</p>
            <p>We sincerely apologize for the inconvenience. Please visit our store to find similar products.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${getBaseUrl()}/collections" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">Browse Products</a>
            </div>
            <p>The Link Flame Team</p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; 2026 Link Flame. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send subscription payment failure notification email
 */
export async function sendSubscriptionPaymentFailedEmail(
  to: string,
  subscriptionVisibleId: string,
  customerName: string,
  failedAttemptCount: number
): Promise<{ success: boolean; error?: unknown }> {
  if (!resend) {
    logger.warn('Resend not configured - skipping subscription payment failure email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Action needed: Subscription payment failed - Link Flame',
      html: generateSubscriptionPaymentFailedHTML(
        subscriptionVisibleId,
        customerName,
        failedAttemptCount
      ),
    });

    if (error) {
      logger.error('Failed to send subscription payment failed email', error, {
        to,
        subscriptionVisibleId,
        failedAttemptCount,
      });
      return { success: false, error };
    }

    logger.info('Subscription payment failed email sent', {
      to,
      subscriptionVisibleId,
      failedAttemptCount,
    });
    return { success: true };
  } catch (error) {
    logger.error('Error sending subscription payment failed email', error, {
      to,
      subscriptionVisibleId,
      failedAttemptCount,
    });
    return { success: false, error };
  }
}

function generateSubscriptionPaymentFailedHTML(
  subscriptionVisibleId: string,
  customerName: string,
  failedAttemptCount: number
): string {
  const failureNotice =
    failedAttemptCount >= 3
      ? 'We have temporarily paused this subscription after multiple failed attempts. Please update your payment method to resume deliveries.'
      : 'Please update your payment method to avoid interruption to your next delivery.';

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Link Flame</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Subscription Payment Issue</p>
          </div>
          <div style="padding: 40px 30px;">
            <p>Hi ${customerName},</p>
            <p>We couldn't process payment for your subscription <strong>${subscriptionVisibleId}</strong>.</p>
            <p>This is failed payment attempt #${failedAttemptCount}.</p>
            <p>${failureNotice}</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${getBaseUrl()}/account/subscriptions" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Manage Subscription
              </a>
            </div>
            <p>If you've already updated your payment details, no further action is needed.</p>
            <p>The Link Flame Team</p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; 2026 Link Flame. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate password reset HTML email
 */
function generatePasswordResetHTML(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Link Flame</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">
              We received a request to reset your password. Click the button below to choose a new password:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
              If the button doesn't work, copy and paste this URL into your browser:
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af; word-break: break-all;">
              ${resetUrl}
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              &copy; 2026 Link Flame. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
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
              <a href="${getBaseUrl()}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
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
              Visit our website: <a href="${getBaseUrl()}" style="color: #10b981; text-decoration: none;">linkflame.com</a>
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
