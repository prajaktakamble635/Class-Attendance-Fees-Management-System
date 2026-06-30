'use strict'

const axios = require('axios')
const logger = require('../logger')
const { PRODUCTION_URL, RETRY_COUNT, RETRY_INTERVAL_MS } = require('../config')

const ENDPOINT = `${PRODUCTION_URL}/iclock/cdata`

// Max records per HTTP POST. Machines can dump tens of thousands of historic
// punches on reconnect; chunking keeps each request a sane size while still
// being vastly fewer requests than one-per-record.
const BATCH_SIZE = 500

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Push one chunk (array of records) to production in a single request.
 * Retries up to RETRY_COUNT times, waiting RETRY_INTERVAL_MS between attempts.
 * The production API accepts a JSON array and de-duplicates on its side, so
 * re-pushing already-stored punches is harmless.
 *
 * @param {Object[]} chunk attendance records
 * @param {string} label human-friendly label for logs
 * @returns {Promise<boolean>} true if delivered (HTTP 200), false otherwise
 */
async function pushChunk (chunk, label) {
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      const response = await axios.post(ENDPOINT, chunk, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      })

      if (response.status === 200) {
        logger.info(`PUSH SUCCESS [${label}] ${chunk.length} record(s) attempt ${attempt}/${RETRY_COUNT}`)
        return true
      }

      logger.warn(`PUSH FAILED [${label}] attempt ${attempt}/${RETRY_COUNT} → status ${response.status}`)
    } catch (err) {
      const reason = err.response ? `status ${err.response.status}` : err.message
      logger.error(`PUSH ERROR [${label}] attempt ${attempt}/${RETRY_COUNT} → ${reason}`)
    }

    if (attempt < RETRY_COUNT) {
      await sleep(RETRY_INTERVAL_MS)
    }
  }

  logger.error(`PUSH GIVE-UP [${label}] after ${RETRY_COUNT} attempts (${chunk.length} record(s))`)
  return false
}

/**
 * Push a batch of attendance records to production as few HTTP requests as
 * possible (chunked, one request per BATCH_SIZE records). Runs sequentially in
 * the background so a huge history dump does not open thousands of sockets.
 *
 * @param {Object[]} records array of attendance records
 */
async function pushToProduction (records) {
  if (!Array.isArray(records) || records.length === 0) return

  const chunkCount = Math.ceil(records.length / BATCH_SIZE)
  logger.info(`Pushing ${records.length} record(s) to production in ${chunkCount} chunk(s): ${ENDPOINT}`)

  // Push chunks one after another in the background; failures are logged inside.
  ;(async () => {
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE)
      const label = `${Math.floor(i / BATCH_SIZE) + 1}/${chunkCount}`
      await pushChunk(chunk, label).catch((err) => {
        logger.error(`Unexpected push error for chunk ${label}: ${err.message}`)
      })
    }
  })()
}

module.exports = pushToProduction
module.exports.pushChunk = pushChunk
