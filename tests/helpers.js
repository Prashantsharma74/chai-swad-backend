const crypto = require('crypto')
const mongoose = require('mongoose')

function customer(overrides = {}) {
  return {
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    address: 'Vijay Nagar, Indore',
    ...overrides
  }
}

function orderBody(menuItemId, overrides = {}) {
  return {
    customer: customer(),
    tableNumber: 5,
    location: { lat: 22.763712, lng: 75.898557 },
    items: [{ menuItemId: String(menuItemId), quantity: 2 }],
    ...overrides
  }
}

function signPayment(orderId, paymentId) {
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
}

function objectId() {
  return new mongoose.Types.ObjectId().toString()
}

module.exports = { customer, orderBody, signPayment, objectId }
