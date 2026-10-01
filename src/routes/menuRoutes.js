const express = require('express')
const menuController = require('../controllers/menuController')

const router = express.Router()

router.get('/', menuController.getMenu)
router.get('/:id', menuController.getMenuItem)

module.exports = router
