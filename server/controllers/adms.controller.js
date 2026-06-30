'use strict';

const { deviceAttendanceLogsTbl } = require('../sequelize');
const { handleSequelizeError } = require('../sequelizeErrorHandler');
const wlogger = require('../logger');

const admsController = {};

// The device reports punch time as IST wall-clock text, e.g. "2024-06-29 12:13:03".
// Pass it to the DATETIME column AS A STRING so Sequelize stores it literally.
// Using `new Date(...)` would re-interpret it through the server zone and then
// Sequelize's timezone:"+05:30" again, double-shifting the stored value.
function normalizePunchDatetime(raw) {
  if (!raw) return null;
  // Keep "YYYY-MM-DD HH:mm:ss" verbatim; tolerate a "T" separator from ISO inputs.
  return String(raw).trim().replace('T', ' ').slice(0, 19);
}

// Normalise one incoming record (from the JSON relay) into a DB row.
function relayRecordToRow(rec) {
  return {
    employeeId: rec.employeeId != null ? String(rec.employeeId).trim() : null,
    punchDatetime: normalizePunchDatetime(rec.datetime),
    status: rec.status != null ? String(rec.status).trim() : null,
    verifyType: rec.verifyType != null ? String(rec.verifyType).trim() : null,
    deviceSN: rec.deviceSN != null ? String(rec.deviceSN).trim() : null,
    receivedAt: rec.receivedAt ? new Date(rec.receivedAt) : null,
    rawPayload: rec,
  };
}

// Parse a raw ESSL/ZKTeco ATTLOG text body (tab-separated punch rows) into DB rows.
// Row format: employee_id <TAB> datetime <TAB> status <TAB> verify_type
function rawAttlogToRows(rawBody, sn) {
  const receivedAt = new Date();
  const lines = String(rawBody)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows = [];
  for (const line of lines) {
    const cols = line.split('\t').length > 1 ? line.split('\t') : line.split(/\s+/);
    const employeeId = cols[0];
    if (!employeeId) continue;

    // datetime may arrive as one field, or as "YYYY-MM-DD" + "HH:mm:ss" split across two tokens.
    let datetime;
    let status;
    let verifyType;
    if (cols[2] && /^\d{2}:\d{2}/.test(cols[2])) {
      datetime = `${cols[1]} ${cols[2]}`;
      status = cols[3];
      verifyType = cols[4];
    } else {
      datetime = cols[1];
      status = cols[2];
      verifyType = cols[3];
    }

    rows.push({
      employeeId: String(employeeId).trim(),
      punchDatetime: normalizePunchDatetime(datetime),
      status: status != null ? String(status).trim() : null,
      verifyType: verifyType != null ? String(verifyType).trim() : null,
      deviceSN: sn != null ? String(sn) : null,
      receivedAt,
      rawPayload: { raw: line },
    });
  }
  return rows;
}

/**
 * GET /iclock/cdata
 * Device registration / handshake. Devices expect a plain-text config reply.
 */
admsController.registerDevice = function (req, res) {
  const sn = req.query.SN || req.query.sn || 'UNKNOWN';
  wlogger.info(`ADMS handshake: SN=${sn}`);

  const reply = [
    `GET OPTION FROM: ${sn}`,
    'Stamp=9999',
    'OpStamp=9999',
    'ErrorDelay=30',
    'Delay=10',
    'TransTimes=00:00;14:05',
    'TransInterval=1',
    'TransFlag=1111000000',
    'Realtime=1',
    'Encrypt=0',
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.status(200).send(reply + '\n');
};

/**
 * POST /iclock/cdata
 * Receives attendance punches and stores them in the standalone
 * tbl_device_attendance_logs table.
 *
 * Accepts two body shapes:
 *   1) JSON from the gurukul-attendance relay: a single record object
 *      { employeeId, datetime, status, verifyType, deviceSN, receivedAt }
 *      (or an array of such objects).
 *   2) Raw ESSL/ZKTeco ATTLOG text (tab-separated rows) sent directly by a device.
 */
admsController.receiveAttendance = async function (req, res) {
  try {
    const body = req.body;
    let rows = [];

    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
      // JSON payload (single object or array of objects) from the relay.
      const records = Array.isArray(body) ? body : [body];
      rows = records
        .filter((r) => r && (r.employeeId != null || r.datetime != null))
        .map(relayRecordToRow);
    } else {
      // Raw text body sent directly by a biometric device.
      const sn = req.query.SN || req.query.sn || 'UNKNOWN';
      const table = req.query.table || '';
      if (table && table.toUpperCase() !== 'ATTLOG') {
        wlogger.info(`ADMS: skipping non-ATTLOG table "${table}" from SN=${sn}`);
        return res.status(200).send('OK');
      }
      const raw = Buffer.isBuffer(body) ? body.toString('utf8') : String(body || '');
      rows = rawAttlogToRows(raw, sn);
    }

    if (rows.length === 0) {
      wlogger.warn('ADMS: received request with no valid attendance rows');
      res.set('Content-Type', 'text/plain');
      return res.status(200).send('OK\n');
    }

    // ignoreDuplicates relies on the unique key (employee_id, punch_datetime,
    // device_sn): biometric machines resend their whole history on reconnect,
    // so already-stored punches are silently skipped instead of duplicated.
    const saved = await deviceAttendanceLogsTbl.bulkCreate(rows, {
      ignoreDuplicates: true,
    });
    wlogger.info(
      `ADMS: received ${rows.length} row(s), stored (new) ${saved.length}`
    );

    // Devices/relay expect a 200 with "OK\n" to consider the batch delivered.
    res.set('Content-Type', 'text/plain');
    return res.status(200).send('OK\n');
  } catch (err) {
    handleSequelizeError(err, res, 'POST /iclock/cdata');
  }
};

/**
 * GET /iclock/getrequest
 * Command polling — no commands to issue, reply OK to keep the device idle.
 */
admsController.getRequest = function (req, res) {
  const sn = req.query.SN || req.query.sn || 'UNKNOWN';
  wlogger.info(`ADMS command poll: SN=${sn}`);
  res.set('Content-Type', 'text/plain');
  res.status(200).send('OK');
};

/**
 * POST /iclock/getrequest
 * Device posts the result of a previously issued command.
 */
admsController.postRequest = function (req, res) {
  const sn = req.query.SN || req.query.sn || 'UNKNOWN';
  let body = '';
  if (typeof req.body === 'string') body = req.body;
  else if (Buffer.isBuffer(req.body)) body = req.body.toString('utf8');
  else body = JSON.stringify(req.body || {});
  wlogger.info(`ADMS command response from SN=${sn}: ${body.slice(0, 500)}`);
  res.set('Content-Type', 'text/plain');
  res.status(200).send('OK');
};

module.exports = admsController;
