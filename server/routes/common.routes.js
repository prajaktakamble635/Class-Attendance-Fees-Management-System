const express = require("express");
const router = express.Router();
const commonController = require("../controllers/common.controller.js");

// Board Subject Conditions APIs
router.get("/boardSubjectConditions", commonController.getAllBoardSubjectConditions);
router.get("/subjectsByCondition", commonController.getSubjectsByBoardSubjectConditionId);
router.get("/getUserInfo", commonController.getUserInfo);
router.post("/requestOtp", commonController.requestOtp)
router.post("/verifyOtp", commonController.verifyOtp)

module.exports = router;
