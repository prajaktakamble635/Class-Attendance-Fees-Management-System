'use strict';

module.exports = (sequelize, DataTypes) => {
  const auditLogsTbl = sequelize.define(
    'tbl_audit_logs',
    {
      id: {
        field: 'audit_log_id_pk',
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Primary key, auto-incremented (BIGINT)',
      },
      entityType: {
        field: 'entity_type',
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Type of entity, e.g. student, marks, hall_ticket, etc.',
      },
      entityId: {
        field: 'entity_id',
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Optional entity ID reference (if applicable)',
      },
      action: {
        field: 'action',
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Action performed: create, update, delete, generate, etc.',
      },
      performedByFk: {
        field: 'performed_by_fk',
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_user',
          key: 'user_id_pk',
        },
        comment: 'FK to tbl_users(id) — user who performed the action',
      },
      performedAt: {
        field: 'performed_at',
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp of when the action was performed',
      },
      details: {
        field: 'details',
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional metadata or payload describing the change',
      },
      ipAddress: {
        field: 'ip_address',
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'IP address from which the action was performed',
      },
    },
    {
      
    }
  );

  // Associations
  auditLogsTbl.associate = function (models) {
  };

  return auditLogsTbl;
};
