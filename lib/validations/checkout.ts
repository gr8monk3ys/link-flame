import { z } from 'zod'

export const GiftOptionsSchema = z.object({
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500, 'Gift message must be 500 characters or less').optional(),
  giftRecipientName: z.string().max(100, 'Recipient name must be 100 characters or less').optional(),
  giftRecipientEmail: z.string().email('Invalid recipient email address').optional().or(z.literal('')),
  hidePrice: z.boolean().default(false),
})

export const CheckoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  ...GiftOptionsSchema.shape,
})

export type CheckoutInput = z.infer<typeof CheckoutSchema>
export type GiftOptionsInput = z.infer<typeof GiftOptionsSchema>
