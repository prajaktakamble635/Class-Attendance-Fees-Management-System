const express = require("express");
const router = express.Router();
const admsController = require("../controllers/adms.controller.js");

// Biometric device (ESSL/ZKTeco ADMS) endpoints — public, no admin auth.
// Some push firmware (PUSH protocol 2.x) appends ".aspx" to every endpoint,
// so both the bare and ".aspx" variants are registered.
router.get(["/cdata", "/cdata.aspx"], admsController.registerDevice);
router.post(["/cdata", "/cdata.aspx"], admsController.receiveAttendance);
router.get(["/getrequest", "/getrequest.aspx"], admsController.getRequest);
router.post(["/getrequest", "/getrequest.aspx"], admsController.postRequest);

module.exports = router;
