'use strict';

module.exports = (sequelize, DataTypes) => {
    const adminOtpsTbl = sequelize.define(
        'tbl_admin_otps',
        {
            id: {
                field: 'admin_otps_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: 'Primary key, auto-incremented'
            },
            userIdFk: {
                field: 'user_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'tbl_user',
                    key: 'user_id_pk'
                },

            },
            action: {
                field: 'action',
                type: DataTypes.STRING(64),
                allowNull: false,
                comment: 'Action for which OTP is generated, e.g., download_report'
            },
            otpCode: {
                field: 'otp_code',
                type: DataTypes.STRING(8),
                allowNull: false,
                comment: 'Generated OTP code'
            },
            sentAt: {
                field: 'sent_at',
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Timestamp when OTP was sent'
            },
            expiresAt: {
                field: 'expires_at',
                type: DataTypes.DATE,
                allowNull: false,
                comment: 'OTP expiry timestamp'
            },
            consumedAt: {
                field: 'consumed_at',
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Timestamp when OTP was consumed'
            },
            consumedByIp: {
                field: 'consumed_by_ip',
                type: DataTypes.STRING(64),
                allowNull: true,
                comment: 'IP address from which OTP was consumed'
            },
            createdBy: {
                field: 'created_by',
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'user_id_pk'
                },
                comment: 'FK to tbl_users(id) who created this OTP'
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 0,
                comment: '0=pending, 1=used, 2=expired'
            }
        },

    );
    adminOtpsTbl.associate = function (models) { }
    return adminOtpsTbl

};
