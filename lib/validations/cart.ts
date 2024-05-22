import { z } from 'zod'

export const AddToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive('Quantity must be a positive integer').max(999, 'Quantity cannot exceed 999').default(1),
})

export const UpdateCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().nonnegative('Quantity must be 0 or positive').max(999, 'Quantity cannot exceed 999'),
})

export type AddToCartInput = z.infer<typeof AddToCartSchema>
export type UpdateCartInput = z.infer<typeof UpdateCartSchema>
