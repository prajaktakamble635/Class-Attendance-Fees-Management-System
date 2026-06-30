const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parent.controller');

router.get('/dashboard', parentController.getDashboardDetails);
router.get('/attendance/:studentId', parentController.getStudentAttendance);
router.get('/notifications', parentController.getNotifications);

module.exports = router;
