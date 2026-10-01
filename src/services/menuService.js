const mongoose = require('mongoose')
const MenuItem = require('../models/MenuItem')
const AppError = require('../utils/appError')
const { getTaxPercent } = require('../utils/money')
const { CATEGORIES } = require('../constants/menu')

const MENU_CACHE_TTL_MS = 3 * 60 * 1000
const menuCache = new Map()

function menuCacheKey(category) {
  return category ? String(category).trim().toLowerCase() : '__all__'
}

function readMenuCache(category) {
  if (process.env.NODE_ENV === 'test') return null
  const hit = menuCache.get(menuCacheKey(category))
  if (!hit || Date.now() - hit.at > MENU_CACHE_TTL_MS) return null
  return hit.data
}

function writeMenuCache(category, data) {
  if (process.env.NODE_ENV === 'test') return
  menuCache.set(menuCacheKey(category), { at: Date.now(), data })
}

function clearMenuCache() {
  menuCache.clear()
}

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
  const cached = readMenuCache(category)
  if (cached) return cached

  const filter = { available: true }

  if (category) {
    if (!/^[A-Za-z ]{1,40}$/.test(category)) {
      throw new AppError('Invalid category', 400)
    }
    filter.category = { $regex: `^${escapeRegex(category.trim())}$`, $options: 'i' }
  }

  const items = await MenuItem.find(filter).sort({ sortOrder: 1, name: 1 }).lean()

  const data = {
    items: items.map(toPublicMenuItem),
    categories: CATEGORIES,
    taxPercent: getTaxPercent()
  }
  writeMenuCache(category, data)
  return data
}

async function getAvailableById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Menu item not found', 404)
  }

  const item = await MenuItem.findOne({ _id: id, available: true }).lean()
  if (!item) {
    throw new AppError('Menu item not found', 404)
  }

  return toPublicMenuItem(item)
}

module.exports = { listAvailable, getAvailableById, toPublicMenuItem, clearMenuCache }
