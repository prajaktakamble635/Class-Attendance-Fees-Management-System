'use strict';

module.exports = (sequelize, DataTypes) => {
  const rollBlockedTbl = sequelize.define(
    'tbl_roll_blocked',
    {
      id: {
        field: 'roll_blocked_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Primary key, auto-incremented'
      },
      rollNo: {
        field: 'roll_no',
        type: DataTypes.STRING(48),
        allowNull: false,
        unique: true,
        comment: 'Blocked roll number (unique)'
      },
      reason: {
        field: 'reason',
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for blocking the roll number'
      },
      blockedAt: {
        field: 'blocked_at',
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp when roll was blocked'
      },
      blockedBy: {
        field: 'blocked_by',
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_user',
          key: 'user_id_pk'
        },
        comment: 'FK to tbl_users(id) who blocked the roll'
      }
    },
    {
    }
  );

  rollBlockedTbl.associate = function (models) {
  };

  return rollBlockedTbl;
};
