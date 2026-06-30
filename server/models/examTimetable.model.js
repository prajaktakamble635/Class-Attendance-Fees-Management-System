'use strict';

module.exports = (sequelize, DataTypes) => {
  const examTimetableTbl = sequelize.define(
    'tbl_exam_timetable',
    {
      id: {
        field: 'exam_timetable_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Primary key, auto-incremented'
      },
      examSessionIdFk: {
        field: 'exam_session_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_exam_sessions',
          key: 'exam_session_id_pk'
        },
        onDelete: 'CASCADE',
        comment: 'FK to tbl_exam_sessions(id)'
      },
      examDate: {
        field: 'exam_date',
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Date of the exam'
      },
      examStartTime:{
        field:"exam_start_time",
        type:DataTypes.TIME,
        allowNull:true 
      },
      examEndTime:{
        field:'exam_end_time',
        type:DataTypes.TIME,
        allowNull:true
      },
      status:{
        field:'status',
        type:DataTypes.TINYINT,
        defaultValue:1,
        comment:'1 - active, 2 - inactive, 3 - delete'
      },
      subjectIdFk: {
        field: 'subject_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_subjects',
          key: 'subject_id_pk'
        },
        comment: 'FK to tbl_subjects(id)'
      },
      maxMarks: {
        field: 'max_marks',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        comment: 'Maximum marks for the subject'
      },
   
    },
    {
      tableName: 'tbl_exam_timetable',

      comment: 'Exam timetable for each session (date + subject)',
      indexes: [
        {
          unique: true,
          fields: ['exam_session_id_fk', 'exam_date', 'subject_id_fk'],
          name: 'idx_unique_session_date_subject'
        },
        {
          unique: false,
          fields: ['exam_session_id_fk'],
          name: 'idx_exam_session_id'
        },
        {
          unique: false,
          fields: ['subject_id_fk'],
          name: 'idx_subject_id'
        }
      ]
    }
  );

  examTimetableTbl.associate = function (models) {
  };

  return examTimetableTbl;
};
