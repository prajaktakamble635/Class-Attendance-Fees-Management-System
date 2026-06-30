const express = require("express");
const router = express.Router();
const publicController = require("../controllers/public.controller.js");

router.get("/downloadDocument", publicController.downloadDocument);
router.post("/uploadDocument", publicController.uploadDocument)
router.post("/verifyUsername", publicController.verifyUsername);
router.post("/verifyPassword", publicController.verifyPassword);
router.get('/logoutAdmin', publicController.logoutAdmin);
router.post("/generate2FA", publicController.generate2FA);
router.post("/verify2FA", publicController.verify2FA);
router.get(
  "/generateAttendanceSheet",
  publicController.generateAttendanceSheet
);
router.get(
  "/generateHallTicket",
  publicController.generateHallTicket
);
router.get(
  "/generateReportCard",
  publicController.generateReportCard
);

router.post("/updateMyPassword", publicController.updateMyPassword)

module.exports = router;