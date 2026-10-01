require('dotenv').config()
const { MongoMemoryServer } = require('mongodb-memory-server')
const { connectDB } = require('./config/database')
const { MENU_ITEMS } = require('./seed/menuSeed')
const MenuItem = require('./models/MenuItem')
const logger = require('./utils/logger')

async function main() {
  const memoryServer = await MongoMemoryServer.create()
  const uri = memoryServer.getUri('chai-swad')
  process.env.MONGODB_URI = uri

  await connectDB(uri)

  for (const item of MENU_ITEMS) {
    await MenuItem.findOneAndUpdate({ slug: item.slug }, item, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    })
  }

  const app = require('./server')
  const port = Number(process.env.PORT) || 5000

  const server = app.listen(port, () => {
    logger.info('Chai Swad API started with in-memory MongoDB', { port })
  })

  async function shutdown() {
    server.close()
    await memoryServer.stop()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  logger.error('Unable to start demo API', { message: err.message })
  process.exit(1)
})
