'use strict';

module.exports = (sequelize, DataTypes) => {
  const marksConditionTbl = sequelize.define(
    "tbl_marks_condition",
    {
      id: {
        field: "marks_condition_id_pk",
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "Primary key, auto-incremented",
      },
      from: {
        field: "from",
        type: DataTypes.INTEGER,
      },
      to: {
        field: "to",
        type: DataTypes.INTEGER,
      },
      colorCode: {
        field: "color_code",
        type: DataTypes.STRING(16),
      },
      name: {
        field: "name",
        type: DataTypes.STRING(128),
      },
    },
    {
      tableName: "tbl_marks_condition",
    }
  );

  // Associations
  marksConditionTbl.associate = function (models) {};

  return marksConditionTbl;
};
