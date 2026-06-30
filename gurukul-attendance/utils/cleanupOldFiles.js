'use strict'

const fs = require('fs')
const path = require('path')
const logger = require('../logger')

const ATTENDANCE_DIR = path.join(__dirname, '..', 'json', 'attendance')

// Files are named YYYY-MM-DD.json.
const FILE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})\.json$/

/**
 * Delete day-wise attendance JSON files older than `months` (default 3).
 * The cutoff is derived from the date encoded in the file name, so it does not
 * depend on filesystem mtimes (which copies/moves can change).
 *
 * @param {number} months retention window in months (default 3)
 * @returns {number} count of files deleted
 */
function cleanupOldFiles (months = 3) {
  if (!fs.existsSync(ATTENDANCE_DIR)) return 0

  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setMonth(cutoff.getMonth() - months)

  let deleted = 0
  let files
  try {
    files = fs.readdirSync(ATTENDANCE_DIR)
  } catch (err) {
    logger.error(`Cleanup: failed to read ${ATTENDANCE_DIR}: ${err.message}`)
    return 0
  }

  for (const name of files) {
    const match = FILE_PATTERN.exec(name)
    if (!match) continue

    const fileDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    if (fileDate < cutoff) {
      try {
        fs.unlinkSync(path.join(ATTENDANCE_DIR, name))
        deleted++
        logger.info(`Cleanup: deleted old attendance file ${name}`)
      } catch (err) {
        logger.error(`Cleanup: failed to delete ${name}: ${err.message}`)
      }
    }
  }

  logger.info(`Cleanup: removed ${deleted} attendance file(s) older than ${months} month(s)`)
  return deleted
}

module.exports = cleanupOldFiles
