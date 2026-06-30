'use strict'

const express = require('express')
const logger = require('./logger')
const { PORT, PRODUCTION_URL, NODE_ENV } = require('./config')
const admsRoutes = require('./routes/adms')
const cleanupOldFiles = require('./utils/cleanupOldFiles')

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const app = express()

// ADMS devices POST attendance as raw tab-separated text, often with a
// Content-Type of application/x-www-form-urlencoded (or none). We must capture
// the body as raw text for EVERY content-type, so express.text runs first and
// alone — an urlencoded parser ahead of it would drain the stream and leave
// req.body an empty object ({}), turning real ATTLOG bodies into "bytes=0".
// Device metadata (SN, table, Stamp) arrives in the query string, not the body.
app.use(express.text({ type: () => true, limit: '10mb' }))

// ADMS endpoints
app.use('/iclock', admsRoutes)

// Health check
app.get('/', (req, res) => {
  res.status(200).send('Gurukul Attendance ADMS server is running')
})

// 404
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`)
  res.status(404).send('Not Found')
})

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err.message}`)
  res.status(500).send('Internal Server Error')
})

app.listen(PORT, () => {
  logger.info('========================================')
  logger.info(' Gurukul Attendance ADMS Server')
  logger.info(`  Environment     : ${NODE_ENV}`)
  logger.info(`  Listening on    : http://0.0.0.0:${PORT}`)
  logger.info(`  ADMS endpoint   : /iclock/cdata`)
  logger.info(`  Forwarding to   : ${PRODUCTION_URL}/iclock/cdata`)
  logger.info('========================================')

  // Purge attendance JSON files older than 3 months: once at startup, then daily.
  cleanupOldFiles(3)
  setInterval(() => cleanupOldFiles(3), ONE_DAY_MS)
})
