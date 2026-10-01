function scrub(value) {
  if (typeof value !== 'string') return value
  return value.replace(/mongodb(\+srv)?:\/\/\S+/gi, '[redacted]')
}

function write(level, message, meta = {}) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message: scrub(message)
  }

  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue
    entry[key] = typeof value === 'string' ? scrub(value) : value
  }

  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
    return
  }
  console.log(line)
}

module.exports = {
  info(message, meta) {
    write('info', message, meta)
  },
  error(message, meta) {
    write('error', message, meta)
  }
}
