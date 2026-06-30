'use strict'

const fs = require('fs')
const path = require('path')
const logger = require('../logger')
const pushToProduction = require('../utils/pushToProduction')

const ATTENDANCE_DIR = path.join(__dirname, '..', 'json', 'attendance')

// Ensure the storage directory exists on first use.
function ensureAttendanceDir () {
  if (!fs.existsSync(ATTENDANCE_DIR)) {
    fs.mkdirSync(ATTENDANCE_DIR, { recursive: true })
  }
}

// Local YYYY-MM-DD (used for the day-wise file name).
function dayKey (date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Append records to ./json/attendance/YYYY-MM-DD.json (array of objects).
function saveRecords (records) {
  ensureAttendanceDir()
  const file = path.join(ATTENDANCE_DIR, `${dayKey()}.json`)

  let existing = []
  if (fs.existsSync(file)) {
    try {
      existing = JSON.parse(fs.readFileSync(file, 'utf8')) || []
      if (!Array.isArray(existing)) existing = []
    } catch (err) {
      logger.error(`Failed to read ${file}, starting fresh: ${err.message}`)
      existing = []
    }
  }

  existing.push(...records)
  fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf8')
  logger.info(`Saved ${records.length} record(s) to ${path.basename(file)} (total ${existing.length})`)
}

/**
 * GET /iclock/cdata — machine registration handshake.
 * The device sends ?SN=XXXX (+ options) and expects a plain-text config reply.
 * We acknowledge with a minimal OK config so the device stays online.
 */
exports.registerDevice = (req, res) => {
  const sn = req.query.SN || req.query.sn || 'UNKNOWN'
  logger.info(`Device registration / handshake: SN=${sn} options=${req.query.options || '-'}`)

  // Standard ADMS handshake response.
  // Realtime=1 + a frequent poll makes the device push each punch immediately.
  // TransTimes is left wide-open (every hour) instead of "00:00;14:05" so a
  // punch is NEVER held back waiting for a scheduled upload window — the old
  // "00:00;14:05" meant a mid-morning punch wouldn't upload until 2:05 PM.
  const reply = [
    `GET OPTION FROM: ${sn}`,
    'Stamp=9999',
    'OpStamp=9999',
    'ErrorDelay=30',
    'Delay=10',
    'TransTimes=00:00;23:59',
    'TransInterval=1',
    'TransFlag=1111000000',
    'Realtime=1',
    'TimeZone=330',
    'Encrypt=0',
  ].join('\n')

  res.set('Content-Type', 'text/plain')
  res.status(200).send(reply + '\n')
}

/**
 * POST /iclock/cdata — receive attendance punches.
 *
 * Query/body carries: SN=DEVICE_SERIAL&table=ATTLOG&Stamp=9999
 * Body (raw text) carries the punch rows, one per line, tab-separated:
 *   employee_id  datetime  status  verify_type
 */
exports.receiveAttendance = (req, res) => {
  const sn = req.query.SN || req.query.sn || (req.body && req.body.SN) || 'UNKNOWN'
  const table = req.query.table || (req.body && req.body.table) || ''
  const receivedAt = new Date().toISOString()

  // Body arrives as raw text (express.text). Fall back to a stringified body.
  const rawBody = typeof req.body === 'string' ? req.body : ''

  logger.info(`POST /iclock/cdata SN=${sn} table=${table} bytes=${Buffer.byteLength(rawBody || '')}`)

  // Count the rows in this batch — ESSL/ZKTeco PUSH firmware expects the ACK to
  // be "OK: <count>\n" (the number of records it should mark as delivered). A
  // bare "OK" leaves the batch unconfirmed, so the device resends it endlessly
  // (this is why OPERLOG floods every ~12s without ever advancing).
  const rowCount = rawBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length

  // Only ATTLOG rows are attendance punches. Other tables (OPERLOG, etc.) are
  // acknowledged with their row count so the device clears them and moves on,
  // but we do not store them.
  if (table && table.toUpperCase() !== 'ATTLOG') {
    logger.info(`Skipping non-ATTLOG table "${table}" (${rowCount} row(s)) from SN=${sn}`)
    res.set('Content-Type', 'text/plain')
    return res.status(200).send(`OK: ${rowCount}\n`)
  }

  const lines = rawBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  // Log the first raw ATTLOG line verbatim (tabs shown as \t) so the exact
  // device column layout can be confirmed when mapping status/verifyType.
  if (lines.length > 0) {
    logger.info(`Raw ATTLOG sample from SN=${sn}: "${lines[0].replace(/\t/g, '\\t')}"`)
  }

  const records = []
  for (const line of lines) {
    // Rows are tab-separated; tolerate runs of whitespace as a fallback.
    const cols = line.split('\t').length > 1 ? line.split('\t') : line.split(/\s+/)
    const [employeeId, datePart, timePart] = cols

    if (!employeeId) {
      logger.warn(`Skipping malformed row from SN=${sn}: "${line}"`)
      continue
    }

    // datetime in ADMS rows is "YYYY-MM-DD HH:mm:ss" (date + time as two whitespace-separated tokens).
    let datetime
    let status
    let verifyType
    if (datePart && timePart && /^\d{2}:\d{2}/.test(timePart)) {
      datetime = `${datePart} ${timePart}`
      status = cols[3]
      verifyType = cols[4]
    } else {
      datetime = datePart
      status = cols[2]
      verifyType = cols[3]
    }

    records.push({
      employeeId: String(employeeId).trim(),
      datetime: datetime ? String(datetime).trim() : null,
      status: status !== undefined ? String(status).trim() : null,
      verifyType: verifyType !== undefined ? String(verifyType).trim() : null,
      deviceSN: String(sn),
      receivedAt,
    })
  }

  if (records.length === 0) {
    logger.warn(`No valid attendance rows parsed from SN=${sn}`)
    res.set('Content-Type', 'text/plain')
    return res.status(200).send(`OK: ${rowCount}\n`)
  }

  try {
    saveRecords(records)
  } catch (err) {
    logger.error(`Failed to save attendance from SN=${sn}: ${err.message}`)
    // Still ACK so the device does not endlessly resend; data loss is logged.
    res.set('Content-Type', 'text/plain')
    return res.status(200).send(`OK: ${rowCount}\n`)
  }

  // Forward to production (fire-and-forget with internal retries/logging).
  pushToProduction(records)

  // ESSL/ZKTeco PUSH devices expect "OK: <count>\n" to mark the batch delivered
  // and advance their stamp; a bare "OK" triggers endless resends.
  logger.info(`Accepted ${records.length} ATTLOG record(s) from SN=${sn}`)
  res.set('Content-Type', 'text/plain')
  res.status(200).send(`OK: ${rowCount}\n`)
}

/**
 * GET /iclock/getrequest — device polls for pending commands.
 * We have no commands to issue, so reply "OK" to keep the device idle/online.
 */
exports.getRequest = (req, res) => {
  const sn = req.query.SN || req.query.sn || 'UNKNOWN'
  logger.info(`Command poll: SN=${sn}`)
  res.set('Content-Type', 'text/plain')
  // No pending commands. "OK\n" is the canonical empty-command reply.
  res.status(200).send('OK\n')
}

/**
 * POST /iclock/getrequest — device posts the result of a previously issued command.
 */
exports.postRequest = (req, res) => {
  const sn = req.query.SN || req.query.sn || 'UNKNOWN'
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
  logger.info(`Command response from SN=${sn}: ${body.slice(0, 500)}`)
  res.set('Content-Type', 'text/plain')
  res.status(200).send('OK')
}
