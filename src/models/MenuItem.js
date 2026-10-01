const mongoose = require('mongoose')
const { CATEGORIES } = require('../constants/menu')

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, enum: CATEGORIES },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
)

menuItemSchema.index({ category: 1 })
menuItemSchema.index({ available: 1 })

module.exports = mongoose.model('MenuItem', menuItemSchema)
