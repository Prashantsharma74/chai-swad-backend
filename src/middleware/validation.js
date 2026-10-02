const { z } = require('zod')
const AppError = require('../utils/appError')
const { ORDER_STATUSES } = require('../constants/order')

const phoneSchema = z
  .string({
    required_error: 'Please enter a valid 10-digit mobile number.',
    invalid_type_error: 'Please enter a valid 10-digit mobile number.'
  })
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number.')

const quantitySchema = z
  .number({
    required_error: 'Quantity must be a whole number of at least 1',
    invalid_type_error: 'Quantity must be a whole number of at least 1'
  })
  .refine((value) => Number.isInteger(value) && value >= 1, 'Quantity must be a whole number of at least 1')
  .refine((value) => value <= 20, 'Quantity cannot exceed 20')

const orderItemSchema = z.object({
  menuItemId: z
    .string({ required_error: 'One or more items are invalid' })
    .regex(/^[a-f\d]{24}$/i, 'One or more items are invalid'),
  quantity: quantitySchema
})

const orderSchema = z.object({
  customer: z.object(
    {
      name: z
        .string({
          required_error: 'Please enter your name.',
          invalid_type_error: 'Please enter your name.'
        })
        .trim()
        .min(1, 'Please enter your name.')
        .max(80, 'Name is too long'),
      phone: phoneSchema,
      email: z
        .string({
          required_error: 'Please enter your email address.',
          invalid_type_error: 'Please enter your email address.'
        })
        .trim()
        .toLowerCase()
        .min(1, 'Please enter your email address.')
        .max(120, 'Email is too long')
        .email('Please enter a valid email address.'),
      address: z
        .string({
          required_error: 'Please enter your address.',
          invalid_type_error: 'Please enter your address.'
        })
        .trim()
        .min(1, 'Please enter your address.')
        .max(300, 'Address is too long')
    },
    {
      required_error: 'Please enter your name.',
      invalid_type_error: 'Please enter your name.'
    }
  ),
  tableNumber: z
    .number()
    .int()
    .min(1, 'Table number is invalid')
    .max(500, 'Table number is invalid')
    .optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
    .optional(),
  items: z
    .array(orderItemSchema, {
      required_error: 'Your cart is empty.',
      invalid_type_error: 'Your cart is empty.'
    })
    .min(1, 'Your cart is empty.')
    .max(30, 'Too many items in the cart')
})

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1, 'Payment verification failed'),
  razorpay_payment_id: z.string().trim().min(1, 'Payment verification failed'),
  razorpay_signature: z.string().trim().min(1, 'Payment verification failed')
})

const phoneQuerySchema = z.object({
  phone: phoneSchema
})

const statusSchema = z.object({
  orderStatus: z.enum(ORDER_STATUSES, {
    errorMap: () => ({ message: 'Invalid order status' })
  })
})

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[property])

    if (!result.success) {
      const fields = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || property
        if (!fields[key]) fields[key] = issue.message
      }
      const message = result.error.issues[0]?.message || 'Invalid request'
      next(new AppError(message, 400, fields))
      return
    }

    if (property === 'body') {
      req.body = result.data
    } else {
      req.validatedQuery = result.data
    }

    next()
  }
}

module.exports = {
  validate,
  orderSchema,
  verifyPaymentSchema,
  phoneQuerySchema,
  statusSchema
}
