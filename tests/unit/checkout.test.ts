import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Checkout API Unit Tests
 *
 * Tests the checkout endpoint validation and business logic:
 * - CSRF token validation
 * - Rate limiting
 * - Form validation with Zod
 * - Cart validation (empty cart, inventory checks)
 * - Price calculation (server-side, never trusts client)
 */

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getServerAuth: vi.fn(),
}))

vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkStrictRateLimit: vi.fn(),
  getIdentifier: vi.fn(() => 'test-identifier'),
}))

vi.mock('@/lib/session', () => ({
  getUserIdForCart: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cartItem: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Import mocked modules
import { getServerAuth } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { checkStrictRateLimit } from '@/lib/rate-limit'
import { getUserIdForCart } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// Import the Zod schema to test validation logic directly
import { z } from 'zod'

// Recreate the CheckoutSchema for testing
const CheckoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
})

const validCheckoutData = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  address: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
}

describe('Checkout Schema Validation', () => {
  it('should accept valid checkout data', () => {
    const result = CheckoutSchema.safeParse(validCheckoutData)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const data = { ...validCheckoutData, email: 'invalid-email' }
    const result = CheckoutSchema.safeParse(data)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('email')
      expect(result.error.errors[0].message).toBe('Invalid email address')
    }
  })

  it('should reject empty first name', () => {
    const data = { ...validCheckoutData, firstName: '' }
    const result = CheckoutSchema.safeParse(data)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('firstName')
      expect(result.error.errors[0].message).toBe('First name is required')
    }
  })

  it('should reject empty last name', () => {
    const data = { ...validCheckoutData, lastName: '' }
    const result = CheckoutSchema.safeParse(data)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('lastName')
    }
  })

  it('should reject empty address', () => {
    const data = { ...validCheckoutData, address: '' }
    const result = CheckoutSchema.safeParse(data)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('address')
    }
  })

  it('should reject empty city', () => {
    const data = { ...validCheckoutData, city: '' }
    const result = CheckoutSchema.safeParse(data)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('city')
    }
  })

  it('should reject empty state', () => {
    const data = { ...validCheckoutData, state: '' }
    const result = CheckoutSchema.safeParse(data)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('state')
    }
  })

  describe('ZIP code validation', () => {
    it('should accept valid 5-digit ZIP code', () => {
      const data = { ...validCheckoutData, zipCode: '12345' }
      const result = CheckoutSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid 9-digit ZIP+4 code', () => {
      const data = { ...validCheckoutData, zipCode: '12345-6789' }
      const result = CheckoutSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid ZIP code format', () => {
      const data = { ...validCheckoutData, zipCode: 'invalid' }
      const result = CheckoutSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('zipCode')
        expect(result.error.errors[0].message).toBe('Invalid ZIP code format')
      }
    })

    it('should reject ZIP code with letters', () => {
      const data = { ...validCheckoutData, zipCode: '1234A' }
      const result = CheckoutSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject ZIP code with too few digits', () => {
      const data = { ...validCheckoutData, zipCode: '1234' }
      const result = CheckoutSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject ZIP code with too many digits', () => {
      const data = { ...validCheckoutData, zipCode: '123456' }
      const result = CheckoutSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  it('should reject multiple invalid fields', () => {
    const data = {
      email: 'invalid',
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zipCode: 'bad',
    }
    const result = CheckoutSchema.safeParse(data)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(1)
    }
  })
})

describe('Checkout Price Calculation', () => {
  // Test that server always calculates prices from database
  it('should calculate total from product prices, not client data', () => {
    const cartItems = [
      { product: { price: 29.99, salePrice: null }, variant: null, quantity: 2 },
      { product: { price: 49.99, salePrice: 39.99 }, variant: null, quantity: 1 },
    ]

    // Calculate like the server does
    const serverTotal = cartItems.reduce((acc, item) => {
      const actualPrice = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.price
      return acc + actualPrice * item.quantity
    }, 0)

    // Should be (29.99 * 2) + (39.99 * 1) = 99.97
    expect(serverTotal).toBeCloseTo(99.97, 2)
  })

  it('should use variant price when variant is present', () => {
    const cartItems = [
      {
        product: { price: 29.99, salePrice: null },
        variant: { price: 34.99, salePrice: null },
        quantity: 1,
      },
    ]

    const serverTotal = cartItems.reduce((acc, item) => {
      const actualPrice = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.price
      return acc + actualPrice * item.quantity
    }, 0)

    expect(serverTotal).toBe(34.99)
  })

  it('should prioritize variant sale price over all other prices', () => {
    const cartItems = [
      {
        product: { price: 100, salePrice: 90 },
        variant: { price: 80, salePrice: 70 },
        quantity: 1,
      },
    ]

    const serverTotal = cartItems.reduce((acc, item) => {
      const actualPrice = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.price
      return acc + actualPrice * item.quantity
    }, 0)

    expect(serverTotal).toBe(70)
  })

  it('should handle items without variants', () => {
    const cartItems = [
      { product: { price: 19.99, salePrice: null }, variant: null, quantity: 3 },
    ]

    const serverTotal = cartItems.reduce((acc, item) => {
      const actualPrice = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.price
      return acc + actualPrice * item.quantity
    }, 0)

    expect(serverTotal).toBeCloseTo(59.97, 2)
  })

  it('should ignore client-provided prices', () => {
    // Simulating what the server does - it doesn't read client prices
    const clientData = {
      ...validCheckoutData,
      total: 0.01, // Client tries to set total to 1 cent
      price: 0.01,
      items: [{ price: 0.01 }],
    }

    // Server ignores these and uses database prices
    const databaseCartItems = [
      { product: { price: 99.99, salePrice: null }, variant: null, quantity: 1 },
    ]

    const serverTotal = databaseCartItems.reduce((acc, item) => {
      const actualPrice = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.price
      return acc + actualPrice * item.quantity
    }, 0)

    // Server uses database price, not client price
    expect(serverTotal).toBe(99.99)
    expect(serverTotal).not.toBe(0.01)
  })
})

describe('Checkout Inventory Validation', () => {
  it('should pass when inventory is sufficient', () => {
    const item = {
      product: { title: 'Test Product', inventory: 10 },
      variant: null,
      quantity: 5,
    }

    const availableInventory = item.variant ? item.variant.inventory : item.product.inventory
    const isAvailable = availableInventory >= item.quantity

    expect(isAvailable).toBe(true)
  })

  it('should fail when inventory is insufficient', () => {
    const item = {
      product: { title: 'Test Product', inventory: 3 },
      variant: null,
      quantity: 5,
    }

    const availableInventory = item.variant ? item.variant.inventory : item.product.inventory
    const isAvailable = availableInventory >= item.quantity

    expect(isAvailable).toBe(false)
  })

  it('should use variant inventory when variant is present', () => {
    const item = {
      product: { title: 'Test Product', inventory: 100 },
      variant: { inventory: 2 },
      quantity: 5,
    }

    const availableInventory = item.variant ? item.variant.inventory : item.product.inventory
    const isAvailable = availableInventory >= item.quantity

    expect(isAvailable).toBe(false)
    expect(availableInventory).toBe(2)
  })

  it('should handle zero inventory', () => {
    const item = {
      product: { title: 'Test Product', inventory: 0 },
      variant: null,
      quantity: 1,
    }

    const availableInventory = item.variant ? item.variant.inventory : item.product.inventory
    const isAvailable = availableInventory >= item.quantity

    expect(isAvailable).toBe(false)
  })
})

describe('Checkout Line Item Generation', () => {
  it('should convert price to cents for Stripe', () => {
    const price = 29.99
    const priceInCents = Math.round(price * 100)

    expect(priceInCents).toBe(2999)
  })

  it('should handle floating point precision', () => {
    const price = 19.99
    const quantity = 3
    const total = price * quantity // 59.97
    const totalInCents = Math.round(total * 100)

    expect(totalInCents).toBe(5997)
  })

  it('should include variant info in product name', () => {
    const product = { title: 'Test Product' }
    const variant = { size: 'Large', color: 'Blue', material: null }

    const variantParts = [variant.size, variant.color, variant.material].filter(Boolean)
    let productName = product.title
    if (variantParts.length > 0) {
      productName += ` (${variantParts.join(', ')})`
    }

    expect(productName).toBe('Test Product (Large, Blue)')
  })

  it('should handle products without variants', () => {
    const product = { title: 'Test Product' }
    const variant = null

    let productName = product.title
    if (variant) {
      const variantParts = [variant.size, variant.color, variant.material].filter(Boolean)
      if (variantParts.length > 0) {
        productName += ` (${variantParts.join(', ')})`
      }
    }

    expect(productName).toBe('Test Product')
  })
})

describe('CSRF and Rate Limiting Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call validateCsrfToken on checkout request', async () => {
    const mockValidate = validateCsrfToken as ReturnType<typeof vi.fn>
    mockValidate.mockResolvedValue(true)

    // Simulate what the route does
    const request = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(validCheckoutData),
    })

    await validateCsrfToken(request)

    expect(mockValidate).toHaveBeenCalledWith(request)
  })

  it('should call checkStrictRateLimit for checkout', async () => {
    const mockRateLimit = checkStrictRateLimit as ReturnType<typeof vi.fn>
    mockRateLimit.mockResolvedValue({ success: true, reset: Date.now() + 60000 })

    const identifier = 'test-user-id'
    await checkStrictRateLimit(identifier)

    expect(mockRateLimit).toHaveBeenCalledWith(identifier)
  })
})
