'use strict'
module.exports = (sequelize, DataTypes) => {
    const subjectsTbl = sequelize.define("tbl_subjects", {
      id: {
        field: "subject_id_pk",
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: "primary key, auto-incremented",
      },
      code: {
        field: "code",
        type: DataTypes.STRING(64),
        defaultValue: null,
        allowNull: true,
        comment: "optional short code",
      },
      name: {
        field: "name",
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      boardIdFK: {
        field: "board_id_fk",
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tbl_boards",
          key: "board_id_pk",
        },
        comment: "boards table reference",
      },
      standardIdFk: {
        field: "standard_id_dk",
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tbl_standards",
          key: "standards_id_pk",
        },
      },
      mediumIdFk: {
        field: "medium_id_fk",
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tbl_mediums",
          key: "mediums_id_pk",
        },
      },
      boardSubjectConditionsId: {
        field: "board_subject_conditions_id",
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isCompulsory: {
        field: "is_compulsory",
        type: DataTypes.TINYINT,
        defaultValue: 0,
        comment: "0 - no, 1 - yes",
      },
      isDefaultSelected: {
        field: "is_default_selected",
        type: DataTypes.TINYINT,
        defaultValue: 0,
        comment: "0 - no, 1 - yes",
      },
      isNa: {
        field: "is_na",
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: "1 - yes, 2 - no",
      },
      maxMarks: {
        field: "max_marks",
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 100,
      },
      sortOrder: {
        field: "sort_order",
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      status: {
        field: "status",
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
    });

    subjectsTbl.associate = function (models) { }
    return subjectsTbl
}