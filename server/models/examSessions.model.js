'use strict';

module.exports = (sequelize, DataTypes) => {
  const examSessionsTbl = sequelize.define(
    "tbl_exam_sessions",
    {
      id: {
        field: "exam_session_id_pk",
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "Primary key, auto-incremented",
      },
      name: {
        field: "name",
        type: DataTypes.STRING(128),
        allowNull: false,
        comment: "Exam session name, e.g., YTS Dec 2025 Set1",
      },
      boardIdFk: {
        field: "board_id_fk",
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_boards",
          key: "board_id_pk",
        },
        comment: "FK to tbl_boards(id)",
      },
      standardIdFk: {
        field: "standard_id_fk",
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_standards",
          key: "standards_id_pk",
        },
        comment: "FK to tbl_standards(id)",
      },
      boardSubjectConditionsId: {
        field: "board_subject_conditions_id",
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      setIdFk: {
        field: "set_id_fk",
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tbl_sets",
          key: "set_id_pk",
        },
        comment: "FK to tbl_sets(id), nullable",
      },
      dateFrom: {
        field: "date_from",
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Exam start date",
      },
      dateTo: {
        field: "date_to",
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Exam end date",
      },
      status:{
        field:'status',
        type:DataTypes.TINYINT,
        defaultValue:1,
        comment:'1 - active, 2 - inactive, 3 - delete'
      },
      createdAt: {
        field: "created_at",
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Record creation timestamp",
      },
      createdBy: {
        field: "created_by",
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tbl_user",
          key: "user_id_pk",
        },
        comment: "FK to tbl_users(id) who created the session",
      },
    },
    {
      tableName: "tbl_exam_sessions",

      comment: "A logical exam run (board + set + date range)",
      indexes: [
        {
          unique: false,
          fields: ["board_id_fk"],
          name: "idx_board_id",
        },
        {
          unique: false,
          fields: ["standard_id_fk"],
          name: "idx_standard_id",
        },
        {
          unique: false,
          fields: ["set_id_fk"],
          name: "idx_set_id",
        },
      ],
    }
  );

  examSessionsTbl.associate = function (models) {
  };

  return examSessionsTbl;
};
