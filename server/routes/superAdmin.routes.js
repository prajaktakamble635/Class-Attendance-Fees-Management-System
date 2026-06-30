const express = require("express");
const router = express.Router();
const superAdminController = require("../controllers/superAdmin.controller.js");

router.get("/getMyProfile", superAdminController.getMyProfile);
router.post("/updateMyPassword", superAdminController.updateMyPassword)
router.put("/updateParentPassword/:studentId", superAdminController.updateParentPassword);
router.post("/enableTwoFactorVerification", superAdminController.enableTwoFactorVerification);
router.post("/disableTwoFactorVerification", superAdminController.disableTwoFactorVerification);
router.post("/verify2FA", superAdminController.verify2FA);
router.get("/getAllBoardSubjectConditionData", superAdminController.getAllBoardSubjectConditionData);
router.get("/getBoardSubjectConditionDataForSelect", superAdminController.getBoardSubjectConditionDataForSelect)
router.get("/getAllSubjectBoardConditionWise", superAdminController.getAllSubjectBoardConditionWise);
router.post("/addExamTimeTable", superAdminController.addExamTimeTable);
router.put("/updateExamTimeTable/:id", superAdminController.updateExamTimeTable);
router.delete("/deleteExamTimeTable/:id", superAdminController.deleteExamTimeTable);

router.get("/getAllSetData", superAdminController.getAllSetData)

router.get('/getStudentsWithPendingFees', superAdminController.getStudentsWithPendingFees);
router.get('/getStudentFeesDetails/:id', superAdminController.getStudentFeesDetails);
router.post("/addStudentFee", superAdminController.addStudentFee);
router.get('/getStudentsAllData', superAdminController.getStudentsAllData);

router.get("/getStudentFeeById/:feeId", superAdminController.getStudentFeeById);
router.put("/updateStudentFee/:feeId", superAdminController.updateStudentFee);
router.get("/searchSubjectsByCondition", superAdminController.searchSubjectsByCondition);

router.post("/getTableExams", superAdminController.getTableExams);
router.get("/getExamsDetailsById/:examId", superAdminController.getExamDetailsById);
// 📁 routes/superAdminApi.js
router.get("/getExamSessionsByCondition", superAdminController.getExamSessionsByCondition);
router.get("/generateAttendanceSheet", superAdminController.generateAttendanceSheet);
// 🎫 Get Students for Hall Ticket
router.get("/getStudentsForHallTicket", superAdminController.getStudentsForHallTicket);
router.post("/generateHallTicket", superAdminController.generateHallTicket);
router.get("/getStudentReportCards", superAdminController.getStudentReportCards);
router.get("/getStudentInstallments", superAdminController.getStudentInstallments);
router.post("/updateStudentInstallments", superAdminController.updateStudentInstallments);

//admission-routes
router.post("/addStudentAdmission", superAdminController.addStudentAdmission);
router.post("/getTableStudents", superAdminController.getTableStudents);
router.post("/changeStudentStatus", superAdminController.changeStudentStatus);
router.post("/updateStudentPhoto", superAdminController.updateStudentPhoto);
router.get("/getStudentDetailsById", superAdminController.getStudentDetailsById);
router.post("/updateStudentAdmission", superAdminController.updateStudentAdmission);
router.post("/importAdmissions", superAdminController.importAdmissions);
router.get("/getSubjectCodesByCondition", superAdminController.getSubjectCodesByCondition);
router.post("/generateReportCard", superAdminController.generateReportCard);
router.get("/getStudentsForReportCard", superAdminController.getStudentsForReportCard);
router.get("/getAllBoardData", superAdminController.getAllBoardData);
router.get("/getAllStandards", superAdminController.getAllStandards);
router.get("/getAllSetData", superAdminController.getAllSetData);
router.post("/getStudentDataForExport", superAdminController.getStudentDataForExport);
router.post("/deleteStudentsInBulk", superAdminController.deleteStudentsInBulk);
router.post("/exportSelectedStudents", superAdminController.exportSelectedStudents)

//marks-entry-routes
router.post("/getStudentsForMarksEntry", superAdminController.getStudentsForMarksEntry);
router.get("/subjectsByCondition", superAdminController.getSubjectsByCondition);
router.get("/studentsByCondition", superAdminController.getStudentsByCondition);
router.get("/getStudentsByConditionForSelect", superAdminController.getStudentsByConditionForSelect)
router.get("/getStudentSubjectsByCondition", superAdminController.getStudentSubjectsByCondition)
router.post("/importStudentMarksThroughExcel", superAdminController.importStudentMarksThroughExcel);
router.post("/importStudentMarksThroughTable", superAdminController.importStudentMarksThroughTable)
router.get("/getMaxMarksSubjectWise", superAdminController.getMaxMarksSubjectWise)
router.get("/getAllStudentsData", superAdminController.getAllStudentsData)
router.get("/getStudentForSelect", superAdminController.getStudentForSelect)
router.get("/getExamSessionsForStudent", superAdminController.getExamSessionsForStudent)
router.get("/getExamSessionForStudentForSelect", superAdminController.getExamSessionForStudentForSelect)
router.post("/getSubjectsForStudent", superAdminController.getSubjectsForStudent)
router.post("/manuallyAddStudentMark", superAdminController.manuallyAddStudentMark);

//----------reports-api-------------------
router.post("/getStudentMarksReport", superAdminController.getStudentMarksReport);
router.post("/getStudentOverallPerformance", superAdminController.getStudentOverallPerformance);
router.get("/getStudentDataForReports", superAdminController.getStudentDataForReports);
router.get("/getStudentDataReportsForSelect", superAdminController.getStudentDataReportsForSelect);
router.post("/deleteStudent", superAdminController.deleteStudent);

//----------------- Employee api ----------------------------------
router.post("/getTableEmployee", superAdminController.getTableEmployee);
router.post("/createEmployee", superAdminController.createEmployee);
router.post("/updateEmployee", superAdminController.updateEmployee);
router.post("/updateEmployeePassword", superAdminController.updateEmployeePassword);
router.post("/changeEmployeeStatus", superAdminController.changeEmployeeStatus);
router.post("/deleteEmployee", superAdminController.deleteEmployee)
router.post("/getDailyAttendance", superAdminController.getDailyAttendance);


router.get("/getSubjectsByExamSession", superAdminController.getSubjectsByExamSession);
router.get("/getAllStudentIdsForReportCard", superAdminController.getAllStudentIdsForReportCard);

router.post("/getAllSubjectsForCondition", superAdminController.getAllSubjectsForCondition);
router.post("/getSubjectForConditionBySearch", superAdminController.getSubjectForConditionBySearch)

router.post("/updateMyPassword", superAdminController.updateMyPassword)
router.put("/updateParentPassword/:studentId", superAdminController.updateParentPassword)

module.exports = router;