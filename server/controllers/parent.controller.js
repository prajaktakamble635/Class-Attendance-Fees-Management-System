const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  userTbl,
  studentTbl,
  standardsTbl,
  boardsTbl,
  mediumsTbl,
  studentFeesTbl,
  studentFeesInstallmentsTbl,
  studentSubjectsTbl,
  subjectsTbl,
  studentMarksTbl,
  examTimetableTbl,
  examSessionsTbl,
  studentAttendanceTbl,
  deviceAttendanceLogsTbl
} = require("../sequelize.js");
const { handleSequelizeError } = require('../sequelizeErrorHandler')

const parentController = {};

parentController.getDashboardDetails = async (req, res) => {
  try {
    const userId = req.uid; // from authenticateUser middleware
    const user = await userTbl.findByPk(userId);
    
    if (!user || user.userRole !== 5) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const parentMobile = user.mobile;
    
    // Find students associated with this parent's mobile
    const students = await studentTbl.findAll({
      where: {
        [Op.or]: [
          { fatherMobile: parentMobile },
          { motherMobile: parentMobile },
          { studentMobile: parentMobile }
        ],
        status: 1
      },
      include: [
        { model: boardsTbl, as: 'tbl_boards', attributes: ['name'] },
        { model: standardsTbl, as: 'tbl_standards', attributes: ['name'] },
        { model: mediumsTbl, as: 'tbl_mediums', attributes: ['name'] }
      ]
    });

    if (!students || students.length === 0) {
      return res.status(200).json({ students: [] });
    }

    // Enhance student data with recent marks and subjects
    const enhancedStudents = await Promise.all(students.map(async (student) => {
      // Get enrolled subjects
      const enrolledSubjects = await studentSubjectsTbl.findAll({
        where: { studentIdFk: student.id, isActive: 1 },
        include: [{ model: subjectsTbl, as: 'tbl_subjects', attributes: ['name', 'code'] }]
      });

      // Get recent marks
      const recentMarks = await studentMarksTbl.findAll({
        where: { studentIdFk: student.id },
        include: [
          { model: examSessionsTbl, as: 'tbl_exam_sessions', attributes: ['name'] },
          { model: subjectsTbl, as: 'tbl_subjects', attributes: ['name'] }
        ],
        order: [['id', 'DESC']],
        limit: 20
      });

      const marksWithMax = await Promise.all(recentMarks.map(async (m) => {
        const plainMark = m.get({ plain: true });
        const timetable = await examTimetableTbl.findOne({
          where: {
            examSessionIdFk: plainMark.examSessionIdFk,
            subjectIdFk: plainMark.subjectIdFk,
            status: 1
          }
        });
        if (timetable && timetable.maxMarks) {
           plainMark.outOf = timetable.maxMarks;
        }
        return plainMark;
      }));

      // Get pending installments
      const installments = await studentFeesInstallmentsTbl.findAll({
        where: { studentIdFk: student.id }
      });

      let calculatedFeesPaid = parseFloat(student.feesPaid || 0);
      if (student.paymentType === 2 && installments.length > 0) {
        calculatedFeesPaid = installments.reduce((sum, i) => sum + parseFloat(i.paidAmount || 0), 0);
      }
      const calculatedFeesRemaining = Math.max(0, parseFloat(student.totalFees || 0) - calculatedFeesPaid);

      return {
        ...student.get({ plain: true }),
        feesPaid: calculatedFeesPaid.toFixed(2),
        feesRemaining: calculatedFeesRemaining.toFixed(2),
        enrolledSubjects: enrolledSubjects.map(s => s.tbl_subjects),
        recentMarks: marksWithMax,
        installments: installments.map(i => i.get({ plain: true }))
      };
    }));

    return res.status(200).json({ students: enhancedStudents });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "parentController.getDashboardDetails");
  }
};

parentController.getStudentAttendance = async (req, res) => {
  try {
    const userId = req.uid;
    const user = await userTbl.findByPk(userId);
    if (!user || user.userRole !== 5) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const { studentId } = req.params;
    const parentMobile = user.mobile;

    // Verify student belongs to parent
    const student = await studentTbl.findOne({
      where: {
        id: studentId,
        [Op.or]: [
          { fatherMobile: parentMobile },
          { motherMobile: parentMobile },
          { studentMobile: parentMobile }
        ]
      }
    });

    if (!student) {
      return res.status(403).json({ message: "Not authorized to view this student's attendance" });
    }

    const logs = await deviceAttendanceLogsTbl.findAll({
      where: { employeeId: studentId.toString() },
      order: [['punchDatetime', 'ASC']]
    });

    const groupedByDate = {};
    for (const log of logs) {
      if (!log.punchDatetime) continue;
      
      // Use localized formatting to avoid timezone offset issues
      const dateObj = new Date(log.punchDatetime);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {
           date: dateStr,
           punches: []
        };
      }
      groupedByDate[dateStr].punches.push(log.punchDatetime);
    }

    const attendanceRecords = Object.values(groupedByDate).map(group => {
      const punchIn = group.punches[0];
      let punchOut = null;
      for (let i = 1; i < group.punches.length; i++) {
        const diffMins = (new Date(group.punches[i]) - new Date(punchIn)) / 60000;
        if (diffMins >= 10) {
          punchOut = group.punches[i];
          break; // First punch after 10 mins is punchOut
        }
      }
      
      return {
        id: group.date, // use date as id
        date: group.date,
        punchIn: punchIn,
        punchOut: punchOut,
        status: 'Present' // If there's a punch, they are Present
      };
    });

    // Sort by date descending
    attendanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to 365
    const recentRecords = attendanceRecords.slice(0, 365);

    return res.status(200).json({ success: true, attendance: recentRecords });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "parentController.getStudentAttendance");
  }
};

parentController.getNotifications = async (req, res) => {
  try {
    const userId = req.uid;
    const user = await userTbl.findByPk(userId);
    if (!user || user.userRole !== 5) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const parentMobile = user.mobile;
    const students = await studentTbl.findAll({
      where: {
        [Op.or]: [
          { fatherMobile: parentMobile },
          { motherMobile: parentMobile },
          { studentMobile: parentMobile }
        ],
        status: 1
      }
    });

    if (!students || students.length === 0) {
      return res.status(200).json({ notifications: [] });
    }

    const studentIds = students.map(s => s.id);
    const notifications = [];

    // 1. Attendance Notifications (Today's Punches)
    const todayStr = new Date().toISOString().split("T")[0];
    const logs = await deviceAttendanceLogsTbl.findAll({
      where: {
        employeeId: { [Op.in]: studentIds.map(id => id.toString()) },
        punchDatetime: {
          [Op.gte]: new Date(`${todayStr}T00:00:00Z`),
          [Op.lte]: new Date(`${todayStr}T23:59:59Z`)
        }
      },
      order: [['punchDatetime', 'ASC']]
    });

    // Group logs by student
    const studentLogs = {};
    for (const log of logs) {
      if (!studentLogs[log.employeeId]) studentLogs[log.employeeId] = [];
      studentLogs[log.employeeId].push(log);
    }

    // Generate Attendance Notifications
    for (const stu of students) {
      const stuLogs = studentLogs[stu.id.toString()] || [];
      if (stuLogs.length > 0) {
        const punchIn = new Date(stuLogs[0].punchDatetime);
        notifications.push({
          id: `att_${stu.id}_${punchIn.getTime()}`,
          type: "attendance",
          message: `${stu.firstName} punched IN at ${punchIn.toLocaleTimeString()}`,
          time: punchIn.toLocaleTimeString(),
          ts: punchIn.getTime()
        });

        // Check for punch out (at least 10 mins later)
        let punchOut = null;
        for (let i = 1; i < stuLogs.length; i++) {
          const outTime = new Date(stuLogs[i].punchDatetime);
          const diffMins = (outTime - punchIn) / 60000;
          if (diffMins >= 10) {
            punchOut = outTime;
            break;
          }
        }

        if (punchOut) {
          notifications.push({
            id: `att_out_${stu.id}_${punchOut.getTime()}`,
            type: "attendance",
            message: `${stu.firstName} punched OUT at ${punchOut.toLocaleTimeString()}`,
            time: punchOut.toLocaleTimeString(),
            ts: punchOut.getTime()
          });
        }
      }
    }

    // 2. Fee Dues Notification (Within next 5 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);

    const installments = await studentFeesInstallmentsTbl.findAll({
      where: {
        studentIdFk: { [Op.in]: studentIds },
        paidStatus: { [Op.ne]: 1 }, // Not paid
        dueDate: {
          [Op.gte]: today.toISOString().split('T')[0],
          [Op.lte]: fiveDaysFromNow.toISOString().split('T')[0]
        }
      }
    });

    for (const inst of installments) {
      const stu = students.find(s => s.id === inst.studentIdFk);
      if (stu) {
        notifications.push({
          id: `fee_${inst.id}`,
          type: "fee",
          message: `Fee installment of ₹${inst.amount} for ${stu.firstName} is due on ${inst.dueDate}`,
          time: inst.dueDate,
          ts: new Date(inst.dueDate).getTime()
        });
      }
    }

    // Sort notifications by timestamp descending (newest first)
    notifications.sort((a, b) => b.ts - a.ts);

    return res.status(200).json({ notifications });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "parentController.getNotifications");
  }
};

module.exports = parentController;
