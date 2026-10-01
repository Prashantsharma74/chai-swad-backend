const mongoose = require('mongoose')
const MenuItem = require('../models/MenuItem')
const AppError = require('../utils/appError')
const { getTaxPercent } = require('../utils/money')
const { CATEGORIES } = require('../constants/menu')

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toPublicMenuItem(item) {
  return {
    id: String(item._id),
    name: item.name,
    slug: item.slug,
    category: item.category,
    description: item.description,
    price: item.price,
    image: item.image || '',
    available: item.available,
    sortOrder: item.sortOrder
  }
}

async function listAvailable(category) {
  const filter = { available: true }

  if (category) {
    if (!/^[A-Za-z ]{1,40}$/.test(category)) {
      throw new AppError('Invalid category', 400)
    }
    filter.category = { $regex: `^${escapeRegex(category.trim())}$`, $options: 'i' }
  }

  const items = await MenuItem.find(filter).sort({ sortOrder: 1, name: 1 })

  return {
    items: items.map(toPublicMenuItem),
    categories: CATEGORIES,
    taxPercent: getTaxPercent()
  }
}

async function getAvailableById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Menu item not found', 404)
  }

  const item = await MenuItem.findOne({ _id: id, available: true })
  if (!item) {
    throw new AppError('Menu item not found', 404)
  }

  return toPublicMenuItem(item)
}

module.exports = { listAvailable, getAvailableById, toPublicMenuItem }
