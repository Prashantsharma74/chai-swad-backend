module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupDb.js'],
  clearMocks: true,
  forceExit: true,
  maxWorkers: 1
}
