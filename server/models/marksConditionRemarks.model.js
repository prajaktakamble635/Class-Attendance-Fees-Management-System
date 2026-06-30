'use strict';

module.exports = (sequelize, DataTypes) => {
  const marksConditionRemarksTbl = sequelize.define(
    "tbl_marks_condition_remarks",
    {
      id: {
        field: "marks_condition_remarks_id_pk",
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "Primary key, auto-incremented",
      },
      srno: {
        field: "srno",
        type: DataTypes.INTEGER,
      },
      remark: {
        field: "remark",
        type: DataTypes.TEXT,
      },
      marksConditionIdFk: {
        field: "marks_condition_id_fk",
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_marks_condition",
          key: "marks_condition_id_pk",
        },
        comment: "FK to tbl_marks_condition(id)",
      },
    },
    {
      tableName: "tbl_marks_condition_remarks",
    }
  );

  // Associations
  marksConditionRemarksTbl.associate = function (models) {};

  return marksConditionRemarksTbl;
};
