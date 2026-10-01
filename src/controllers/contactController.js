const asyncHandler = require('../utils/asyncHandler')
const { sendSuccess } = require('../utils/response')
const { getContactInfo } = require('../config/contact')

const getContact = asyncHandler(async (req, res) => {
  sendSuccess(res, 'Contact fetched successfully', { contact: getContactInfo() })
})

module.exports = { getContact }
