import { z } from 'zod'

export const GiftOptionsSchema = z.object({
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500, 'Gift message must be 500 characters or less').optional(),
  giftRecipientName: z.string().max(100, 'Recipient name must be 100 characters or less').optional(),
  giftRecipientEmail: z.email('Invalid recipient email address').optional().or(z.literal('')),
  hidePrice: z.boolean().default(false),
})

export const CheckoutSchema = z.object({
  email: z.email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  // Stripe Checkout collects the shipping (or, for downloads, billing)
  // address; these stay accepted for older clients but are no longer required.
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').optional().or(z.literal('')),
  ...GiftOptionsSchema.shape,
  // Optional discount fields
  loyaltyPointsToRedeem: z.number().int().positive().optional(),
  giftCardCode: z.string().trim().min(1).max(20).optional(),
  giftCardAmount: z.number().positive().optional(),
})

export type CheckoutInput = z.infer<typeof CheckoutSchema>
export type GiftOptionsInput = z.infer<typeof GiftOptionsSchema>
