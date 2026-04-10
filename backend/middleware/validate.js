/**
 * validate.js
 * Zod-based input validation middleware.
 * Usage: router.post('/route', validate(schema), controller)
 */

const { z } = require('zod');

// ─── Sanitize helpers ──────────────────────────────────────────────────────────
const sanitizeString = (s) => (typeof s === 'string' ? s.trim().replace(/<[^>]*>/g, '') : s);

// ─── Reusable field schemas ────────────────────────────────────────────────────
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number')
  .transform(sanitizeString);

const addressSchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeString),
  phone: phoneSchema,
  street: z.string().min(5).max(200).transform(sanitizeString),
  city: z.string().min(2).max(100).transform(sanitizeString),
  state: z.string().min(2).max(100).transform(sanitizeString),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().default('India').transform(sanitizeString),
  isDefault: z.boolean().optional().default(false),
  type: z.enum(['home', 'work', 'other']).optional().default('home'),
});

// ─── Exported Schemas ──────────────────────────────────────────────────────────

const schemas = {
  placeOrder: z.object({
    paymentMethod: z.enum(['razorpay', 'cod']),
    shippingAddress: addressSchema,
    coupon: z
      .object({ code: z.string().max(20).transform(sanitizeString) })
      .optional(),
  }),

  updateProfile: z.object({
    name: z.string().min(2).max(100).transform(sanitizeString).optional(),
    phone: phoneSchema.optional(),
    preferences: z
      .object({
        sizes: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
      })
      .optional(),
  }),

  addAddress: addressSchema,
  updateAddress: addressSchema.partial(),

  createCoupon: z.object({
    code: z
      .string()
      .min(3)
      .max(20)
      .regex(/^[A-Z0-9_-]+$/, 'Coupon code must be uppercase alphanumeric')
      .transform((s) => s.toUpperCase()),
    discountType: z.enum(['flat', 'percentage']),
    discountValue: z.number().positive().max(100000),
    minOrderAmount: z.number().min(0).optional().default(0),
    maxDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    userLimit: z.number().int().positive().optional().default(1),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
  }),

  updateOrderStatus: z.object({
    status: z.enum(['pending', 'reserved', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    note: z.string().max(500).transform(sanitizeString).optional(),
  }),

  cancelOrder: z.object({
    reason: z.string().max(200).transform(sanitizeString).optional(),
  }),

  offlineSale: z.object({
    customerName: z.string().max(100).transform(sanitizeString).optional(),
    phone: z.string().max(15).optional(),
    date: z.string().datetime().optional(),
    products: z.array(
      z.object({
        productId: z.string().optional(),
        productName: z.string().transform(sanitizeString),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        total: z.number().positive(),
      })
    ).optional().default([]),
    totalAmount: z.number().positive(),
    discount: z.number().min(0).optional().default(0),
    finalAmount: z.number().positive(),
    description: z.string().max(500).transform(sanitizeString).optional(),
  }),

  assignRole: z.object({
    uid: z.string().min(1, 'UID is required'),
    role: z.enum(['admin', 'user']),
  }),

  createRazorpayOrder: z.object({
    orderId: z.string().min(1, 'orderId is required'),
  }),

  verifyPayment: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
    orderId: z.string().min(1),
  }),
};

// ─── Middleware Factory ────────────────────────────────────────────────────────

/**
 * @param {z.ZodSchema} schema - Zod schema to validate against req.body
 * @param {'body'|'query'|'params'} source - which request part to validate
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Replace req[source] with the parsed (sanitized) data
  req[source] = result.data;
  next();
};

module.exports = { validate, schemas };
