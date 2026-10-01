const asyncHandler = require('../utils/asyncHandler')
const { sendSuccess } = require('../utils/response')
const menuService = require('../services/menuService')

const getMenu = asyncHandler(async (req, res) => {
  const result = await menuService.listAvailable(req.query.category)
  sendSuccess(res, 'Menu fetched successfully', result)
})

const getMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.getAvailableById(req.params.id)
  sendSuccess(res, 'Menu item fetched successfully', { item })
})

module.exports = { getMenu, getMenuItem }
