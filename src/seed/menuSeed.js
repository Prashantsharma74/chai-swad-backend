const MENU_ITEMS = [
  {
    name: 'Masala Sandwich',
    slug: 'masala-sandwich',
    category: 'Sandwich',
    description: 'Toasted sandwich filled with spiced potato masala.',
    price: 60,
    image: '',
    available: true,
    sortOrder: 1
  },
  {
    name: 'Masala Cheese Sandwich',
    slug: 'masala-cheese-sandwich',
    category: 'Sandwich',
    description: 'Spiced potato masala finished with melted cheese.',
    price: 70,
    image: '',
    available: true,
    sortOrder: 2
  },
  {
    name: 'Cheese Chutney Sandwich',
    slug: 'cheese-chutney-sandwich',
    category: 'Sandwich',
    description: 'Cheese and tangy chutney in toasted bread.',
    price: 60,
    image: '',
    available: true,
    sortOrder: 3
  },
  {
    name: 'Vegetable Sandwich',
    slug: 'vegetable-sandwich',
    category: 'Sandwich',
    description: 'Fresh vegetables with a light house spread.',
    price: 70,
    image: '',
    available: true,
    sortOrder: 4
  },
  {
    name: 'Vegetable Cheese Sandwich',
    slug: 'vegetable-cheese-sandwich',
    category: 'Sandwich',
    description: 'Garden vegetables finished with cheese.',
    price: 80,
    image: '',
    available: true,
    sortOrder: 5
  },
  {
    name: 'Corn Cheese Sandwich',
    slug: 'corn-cheese-sandwich',
    category: 'Sandwich',
    description: 'Sweet corn and cheese, toasted until golden.',
    price: 80,
    image: '',
    available: true,
    sortOrder: 6
  },
  {
    name: 'Paneer Taka Tak Sandwich',
    slug: 'paneer-taka-tak-sandwich',
    category: 'Sandwich',
    description: 'Paneer tossed taka-tak style with peppers and spices.',
    price: 100,
    image: '',
    available: true,
    sortOrder: 7
  },
  {
    name: 'Cold Coffee',
    slug: 'cold-coffee',
    category: 'Beverages',
    description: 'Chilled coffee blended with milk.',
    price: 70,
    image: '',
    available: true,
    sortOrder: 8
  },
  {
    name: 'Cold Coffee with Ice Cream',
    slug: 'cold-coffee-with-ice-cream',
    category: 'Beverages',
    description: 'Cold coffee topped with a scoop of ice cream.',
    price: 90,
    image: '',
    available: true,
    sortOrder: 9
  },
  {
    name: 'Ice Tea',
    slug: 'ice-tea',
    category: 'Beverages',
    description: 'Chilled brewed tea over ice.',
    price: 80,
    image: '',
    available: true,
    sortOrder: 10
  },
  {
    name: 'Lemon Ice Tea',
    slug: 'lemon-ice-tea',
    category: 'Beverages',
    description: 'Ice tea with fresh lemon.',
    price: 90,
    image: '',
    available: true,
    sortOrder: 11
  }
]

async function seedMenu() {
  require('dotenv').config()
  const { connectDB, disconnectDB } = require('../config/database')
  const MenuItem = require('../models/MenuItem')

  await connectDB()

  for (const item of MENU_ITEMS) {
    await MenuItem.findOneAndUpdate({ slug: item.slug }, item, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    })
  }

  console.log(`Seeded ${MENU_ITEMS.length} menu items. Fries category is ready and has no items yet.`)
  await disconnectDB()
}

if (require.main === module) {
  seedMenu().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}

module.exports = { MENU_ITEMS, seedMenu }
