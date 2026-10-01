const asyncHandler = require('../utils/asyncHandler')
const { sendSuccess } = require('../utils/response')
const menuService = require('../services/menuService')

const getMenu = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60')
  const result = await menuService.listAvailable(req.query.category)
  sendSuccess(res, 'Menu fetched successfully', result)
})

const getMenuItem = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60')
  const item = await menuService.getAvailableById(req.params.id)
  sendSuccess(res, 'Menu item fetched successfully', { item })
})

module.exports = { getMenu, getMenuItem }
