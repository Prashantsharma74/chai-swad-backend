const mongoose = require('mongoose')
const { ORDER_STATUSES, PAYMENT_STATUSES } = require('../constants/order')

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      address: { type: String, required: true, trim: true }
    },
    tableNumber: { type: Number, min: 1 },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: {
      provider: { type: String, default: 'razorpay' },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      status: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' }
    },
    orderStatus: { type: String, enum: ORDER_STATUSES },
    whatsappNotification: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String, default: '' }
    },
    emailNotification: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String, default: '' }
    },
    customerEmailNotification: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String, default: '' }
    }
  },
  { timestamps: true }
)

orderSchema.index(
  { orderNumber: 1 },
  { unique: true, partialFilterExpression: { orderNumber: { $type: 'string' } } }
)
orderSchema.index({ 'customer.phone': 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index(
  { 'payment.razorpayOrderId': 1 },
  { unique: true, partialFilterExpression: { 'payment.razorpayOrderId': { $type: 'string' } } }
)
orderSchema.index(
  { 'payment.razorpayPaymentId': 1 },
  { unique: true, partialFilterExpression: { 'payment.razorpayPaymentId': { $type: 'string' } } }
)

module.exports = mongoose.model('Order', orderSchema)
