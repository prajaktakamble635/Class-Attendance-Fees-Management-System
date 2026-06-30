'use strict'

require('dotenv').config({ path: __dirname + '/.env' })

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8080,
  PRODUCTION_URL: process.env.PRODUCTION_URL || 'https://gurukul-api.softthenext.com',
  RETRY_COUNT: Number(process.env.RETRY_COUNT) || 5,
  RETRY_INTERVAL_MS: Number(process.env.RETRY_INTERVAL_MS) || 60000,
}
