const { Sequelize, DataTypes } = require('sequelize')
const { DB_HOST, DB_PASS, DB_PORT, DB_USER, DB_NAME } = require('./config')

//models-import
const userModel = require("./models/user.model.js");
const websiteConfigModel = require("./models/websiteConfig.model.js");
const boardsModel = require("./models/boards.model.js");
const standardsModel = require("./models/standards.model.js");
const mediumsModel = require("./models/mediums.model.js");
const setsModel = require("./models/sets.model.js");
const subjectsModel = require("./models/subjects.model.js");
const adminOtpsModel = require("./models/adminOtps.model.js");
const boardSubjectConditionsModel = require("./models/boardSubjectConditions.model.js");

const studentModel = require("./models/student.model.js");
const studentSetMapModel = require("./models/studentSetMap.model.js");
const studentSubjectsModel = require("./models/studentSubjects.model.js");
const studentFeesInstallmentsModel = require("./models/studentFeesInstallments.model.js");
const studentAttendanceModel = require("./models/studentAttendance.model.js");

const rollBlockedModel = require("./models/rollBlocked.model.js");
const studentFeesModel = require("./models/studentFees.model.js");
const examSessionsModel = require("./models/examSessions.model.js");
const examTimetableModel = require("./models/examTimetable.model.js");

const hallTicketsModel = require("./models/hallTickets.model.js");

const reportCardModel = require("./models/reportCard.model.js");
const studentMarksModel = require("./models/studentMarks.model.js");

const auditLogsModel = require("./models/auditLogs.model.js");

const marksConditionModel = require("./models/marksCondition.model.js");
const marksConditionRemarksModel = require("./models/marksConditionRemarks.model.js");

const downloadRequestModel = require("./models/downloadRequest.model.js");

const deviceAttendanceLogsModel = require("./models/deviceAttendanceLogs.model.js");

const Op = Sequelize.Op;
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
};

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: "mysql",
  port: DB_PORT,
  pool: {
    max: 10,
    min: 0,
    acquire: 150000,
    idle: 1000,
  },
  timezone: "+05:30",
  define: {
    freezeTableName: true,
  },
  logging: false, // change true when there is need to display query in console
  operatorsAliases,
});

const userTbl = userModel(sequelize, Sequelize);
const websiteConfigTbl = websiteConfigModel(sequelize, Sequelize);
const boardsTbl = boardsModel(sequelize, Sequelize);
const standardsTbl = standardsModel(sequelize, Sequelize);
const mediumsTbl = mediumsModel(sequelize, Sequelize);
const setsTbl = setsModel(sequelize, Sequelize);
const subjectsTbl = subjectsModel(sequelize, Sequelize);
const adminOtpsTbl = adminOtpsModel(sequelize, Sequelize);

const boardSubjectConditionsTbl = boardSubjectConditionsModel(
  sequelize,
  Sequelize
);
const studentTbl = studentModel(sequelize, Sequelize);
const studentSetMapTbl = studentSetMapModel(sequelize, Sequelize);
const studentSubjectsTbl = studentSubjectsModel(sequelize, Sequelize);
const rollBlockedTbl = rollBlockedModel(sequelize, Sequelize);
const studentFeesTbl = studentFeesModel(sequelize, Sequelize);
const examSessionsTbl = examSessionsModel(sequelize, Sequelize);
const examTimetableTbl = examTimetableModel(sequelize, Sequelize);
const studentFeesInstallmentsTbl = studentFeesInstallmentsModel(sequelize, Sequelize);
const studentAttendanceTbl = studentAttendanceModel(sequelize, Sequelize);

const hallTicketsTbl = hallTicketsModel(sequelize, Sequelize);
const reportCardTbl = reportCardModel(sequelize, Sequelize);
const studentMarksTbl = studentMarksModel(sequelize, Sequelize);
const auditLogsTbl = auditLogsModel(sequelize, Sequelize);
const marksConditionTbl = marksConditionModel(sequelize, Sequelize);
const marksConditionRemarksTbl = marksConditionRemarksModel(
  sequelize,
  Sequelize
);

const downloadRequestTbl = downloadRequestModel(sequelize, Sequelize)

// Standalone biometric device attendance log (no associations to other tables)
const deviceAttendanceLogsTbl = deviceAttendanceLogsModel(sequelize, Sequelize)

deviceAttendanceLogsTbl.belongsTo(studentTbl, {
  as: 'tbl_student',
  foreignKey: 'employeeId',
  targetKey: 'id'
});

//relations
mediumsTbl.belongsTo(boardsTbl, {
  as: 'tbl_boards',
  foreignKey: 'boardIdFk',
  targetKey: 'id'
});

boardSubjectConditionsTbl.belongsTo(boardsTbl, {
  as: 'tbl_boards',
  foreignKey: 'boardIdFk',
  targetKey: 'id'
});

// boardSubjectConditionsTbl belongs to standardsTbl
boardSubjectConditionsTbl.belongsTo(standardsTbl, {
  as: 'tbl_standards',
  foreignKey: 'standardIdFk',
  targetKey: 'id'
});

// boardSubjectConditionsTbl belongs to mediumsTbl
boardSubjectConditionsTbl.belongsTo(mediumsTbl, {
  as: 'tbl_mediums',
  foreignKey: 'mediumIdFk',
  targetKey: 'id'
});

studentSubjectsTbl.belongsTo(studentTbl, {
  as: "tbl_students",
  foreignKey: "studentIdFk",
  targetKey: "id",
});

studentTbl.belongsTo(standardsTbl, {
  as: 'tbl_standards',
  foreignKey: 'standardIdFk',
  targetKey: 'id'
});

studentTbl.belongsTo(boardsTbl, {
  as: 'tbl_boards',
  foreignKey: 'boardIdFk',
  targetKey: 'id'
});

studentTbl.belongsTo(mediumsTbl, {
  as: 'tbl_mediums',
  foreignKey: 'mediumIdFk',
  targetKey: 'id'
});

studentFeesInstallmentsTbl.belongsTo(studentTbl, {
  as: 'tbl_student',
  foreignKey: 'studentIdFk',
  targetKey: 'id'
})

studentTbl.belongsTo(userTbl, {
  as: 'tbl_user',
  foreignKey: 'createdBy',
  targetKey: 'id'
})

studentSubjectsTbl.belongsTo(subjectsTbl, {
  as: 'tbl_subjects',
  foreignKey: 'subjectIdFk',
  targetKey: 'id'
});

studentSetMapTbl.belongsTo(setsTbl, {
  as: 'tbl_sets',
  foreignKey: 'setIdFk',
  targetKey: 'id'
})

examSessionsTbl.belongsTo(boardsTbl, {
  as: 'tbl_boards',
  foreignKey: 'boardIdFk',
  targetKey: 'id'
})

examSessionsTbl.belongsTo(standardsTbl, {
  as: 'tbl_standards',
  foreignKey: 'standardIdFk',
  targetKey: 'id'
})

examSessionsTbl.belongsTo(setsTbl, {
  as: 'tbl_sets',
  foreignKey: 'setIdFk',
  targetKey: 'id'
})
studentTbl.hasMany(studentFeesInstallmentsTbl, {
  as: 'installments1',
  foreignKey: 'studentIdFk',
});


studentMarksTbl.belongsTo(subjectsTbl, {
  as: 'tbl_subjects',
  foreignKey: 'subjectIdFk',
  targetKey: 'id'
});

studentMarksTbl.belongsTo(examSessionsTbl, {
  as: 'tbl_exam_sessions',
  foreignKey: 'examSessionIdFk',
  targetKey: 'id'
});

downloadRequestTbl.belongsTo(userTbl, {
  as: 'tbl_user',
  foreignKey: 'employeeIdFk',
  targetKey: 'id'
})


sequelize.sync({}).then(() => {
  console.log('Database & tables synced!')
})

module.exports = {
  userTbl,
  websiteConfigTbl,
  boardsTbl,
  standardsTbl,
  mediumsTbl,
  setsTbl,
  subjectsTbl,
  adminOtpsTbl,
  boardSubjectConditionsTbl,
  studentTbl,
  studentSetMapTbl,
  studentSubjectsTbl,
  rollBlockedTbl,
  studentFeesTbl,
  examSessionsTbl,
  examTimetableTbl,
  sequelize,
  hallTicketsTbl,
  reportCardTbl,
  studentMarksTbl,
  auditLogsTbl,
  marksConditionTbl,
  marksConditionRemarksTbl,
  studentFeesInstallmentsTbl,
  studentAttendanceTbl,
  downloadRequestTbl,
  deviceAttendanceLogsTbl
};

studentTbl.hasMany(studentAttendanceTbl, { foreignKey: 'studentIdFk', as: 'tbl_student_attendance' });
studentAttendanceTbl.belongsTo(studentTbl, { foreignKey: 'studentIdFk', as: 'tbl_student' });
