'use strict';

module.exports = (sequelize, DataTypes) => {
  const deviceAttendanceLogsTbl = sequelize.define(
    'tbl_device_attendance_logs',
    {
      id: {
        field: 'device_attendance_log_id_pk',
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Primary key, auto-incremented (BIGINT)',
      },
      employeeId: {
        field: 'employee_id',
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Enrollment / user id as reported by the biometric device',
      },
      punchDatetime: {
        field: 'punch_datetime',
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Punch timestamp reported by the device (YYYY-MM-DD HH:mm:ss)',
      },
      status: {
        field: 'status',
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Raw status/state code from the device (check-in/out etc.)',
      },
      verifyType: {
        field: 'verify_type',
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Verification method code from the device (fingerprint/card/etc.)',
      },
      deviceSN: {
        field: 'device_sn',
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'Serial number of the source biometric device',
      },
      receivedAt: {
        field: 'received_at',
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the ADMS relay received this punch',
      },
      rawPayload: {
        field: 'raw_payload',
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Full original payload received, kept for audit/debugging',
      },
    },
    {
      indexes: [
        { fields: ['employee_id'] },
        { fields: ['device_sn'] },
        { fields: ['punch_datetime'] },
        // A given employee can only punch once at a given timestamp on a given
        // device. Biometric machines resend their whole history on every
        // reconnect, so this unique key lets inserts be idempotent
        // (bulkCreate with ignoreDuplicates) and prevents duplicate rows.
        {
          name: 'uq_device_attendance_punch',
          unique: true,
          fields: ['employee_id', 'punch_datetime', 'device_sn'],
        },
      ],
    }
  );

  // Standalone table: intentionally NOT associated with any other model.
  deviceAttendanceLogsTbl.associate = function (models) {
  };

  return deviceAttendanceLogsTbl;
};
