'use strict';

module.exports = (sequelize, DataTypes) => {
  const studentMarksTbl = sequelize.define(
    "tbl_student_marks",
    {
      id: {
        field: "student_marks_id_pk",
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "Primary key, auto-incremented",
      },
      studentIdFk: {
        field: "student_id_fk",
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_students",
          key: "student_id_pk",
        },
        onDelete: "CASCADE",
        comment: "FK to tbl_students(id)",
      },
      examSessionIdFk: {
        field: "exam_session_id_fk",
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_exam_sessions",
          key: "exam_session_id_pk",
        },
        comment: "FK to tbl_exam_sessions(id)",
      },
      subjectIdFk: {
        field: "subject_id_fk",
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_subjects",
          key: "subject_id_pk",
        },
        comment: "FK to tbl_subjects(id)",
      },
      marksScored: {
        field: "marks_scored",
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Marks obtained by the student",
      },
      outOf: {
        field: "out_of",
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: "Maximum marks for the subject",
      },
      highestMarks: {
        field: "highest_marks",
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Highest marks scored in this subject for faster reports",
      },
      remarks: {
        field: "remarks",
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Optional teacher remarks or notes",
      },
      isAbsent:{
        field:'is_absent',
        type:DataTypes.TINYINT,
        defaultValue:2,
        comment:"1 - absent, 2 - present"
      },
      enteredByFk: {
        field: "entered_by_fk",
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tbl_user",
          key: "user_id_pk",
        },
        comment: "FK to tbl_users(id) who entered the marks",
      },
      enteredAt: {
        field: "entered_at",
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: "Timestamp when marks were entered",
      },
    },
    {
      tableName: "tbl_student_marks",

      comment:
        "Stores marks scored by students for each subject in an exam session",
      indexes: [
        {
          unique: true,
          fields: ["student_id_fk", "exam_session_id_fk", "subject_id_fk"],
        },
      ],
    }
  );

  // Associations
  studentMarksTbl.associate = function (models) {
    studentMarksTbl.belongsTo(models.tbl_students, {
      foreignKey: 'student_id_fk',
      as: 'student',
      onDelete: 'CASCADE',
    });
    studentMarksTbl.belongsTo(models.tbl_exam_sessions, {
      foreignKey: 'exam_session_id_fk',
      as: 'examSession',
    });
    studentMarksTbl.belongsTo(models.tbl_subjects, {
      foreignKey: 'subject_id_fk',
      as: 'subject',
    });
    studentMarksTbl.belongsTo(models.tbl_users, {
      foreignKey: 'entered_by_fk',
      as: 'enteredBy',
    });
  };

  return studentMarksTbl;
};
