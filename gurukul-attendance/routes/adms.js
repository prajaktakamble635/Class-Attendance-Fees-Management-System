'use strict'

const express = require('express')
const router = express.Router()
const admsController = require('../controllers/admsController')

// Some ESSL/ZKTeco/Identix push firmware (PUSH protocol 2.x) appends ".aspx"
// to every endpoint, e.g. GET /iclock/cdata.aspx?SN=...&pushver=2.32. Register
// both the bare and the ".aspx" variants so either firmware style is handled.

// Machine registration / handshake
router.get(['/cdata', '/cdata.aspx'], admsController.registerDevice)

// Receive attendance punches
router.post(['/cdata', '/cdata.aspx'], admsController.receiveAttendance)

// Machine command polling
router.get(['/getrequest', '/getrequest.aspx'], admsController.getRequest)

// Machine command response
router.post(['/getrequest', '/getrequest.aspx'], admsController.postRequest)

module.exports = router
