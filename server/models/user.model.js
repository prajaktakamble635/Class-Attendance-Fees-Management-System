'use strict'
const bcrypt = require("bcryptjs");
module.exports = (sequelize, DataTypes) => {
    const userTbl = sequelize.define(
        'tbl_user',
        {
            id: {
                field: 'user_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: 'primary key, auto-incremented'
            },
            name: {
                field: 'name',
                type: DataTypes.STRING(128),
                allowNull: false
            },
            email: {
                field: 'email',
                type: DataTypes.STRING(128),
                allowNull: true,
                defaultValue: null
            },
            mobile: {
                field: 'mobile',
                type: DataTypes.STRING(32),
                unique: true,
                allowNull: true
            },
            password: {
                field: 'password',
                type: DataTypes.STRING(255),
                allowNull: false
            },
            userRole: {
                field: 'user_role',
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 1,
                comment: '1 - superAdmin, 2 - batch_coordinator, 3 - counseller, 4 - hod'
            },
            lastLogin: {
                field: 'last_login',
                type: DataTypes.DATE,
                defaultValue: null
            },
            lastOtpSentAt: {
                field: 'last_otp_sent_at',
                type: DataTypes.DATE,
                defaultValue: null
            },
            lastOtpMobile: {
                field: 'last_otp_mobile',
                type: DataTypes.STRING(32),
                allowNull: true,
                defaultValue: null
            },
            otpCode: {
                field: 'otp_code',
                type: DataTypes.STRING(8),
                allowNull: true,
                defaultValue: null
            },
            otpSentAt: {
                field: 'otp_sent_at',
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: null
            },
            otpExpiresAt: {
                field: 'otp_expires_at',
                type: DataTypes.DATE,
                defaultValue: null
            },
            verified: {
                field: 'verified',
                type: DataTypes.TINYINT,
                defaultValue: 0
            },
            verifiedAt: {
                field: 'verified_at',
                type: DataTypes.DATE,
                defaultValue: null
            },
            verifiedByIp: {
                field: 'verified_by_ip',
                type: DataTypes.STRING(64),
                defaultValue: null,
                allowNull: true
            },
            isTwoFactorEnabled: {
                field: 'is_two_factor_enabled',
                type: DataTypes.TINYINT,
                defaultValue: 2,
                comment: "1 - yes, 2 - no"
            },
            twoFaSecret: {
                field: 'two_fa_secret',
                type: DataTypes.STRING(255),
                defaultValue: null,
                allowNull: true
            },
            qrDataUrl: {
                field: "qr_data_url",
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: null
            },
            isExistingSecret: {
                field: 'is_existing_secret',
                type: DataTypes.TINYINT,
                defaultValue: 2,
                comment: '1 - yes, 2 - no'
            },
            isAuthenticated: {
                field: 'is_authenticated',
                type: DataTypes.TINYINT,
                defaultValue: 2,
                comment: '1 - yes, 2 - no'
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: "1 - active, 2 - inactive, 3 - deleted"
            }
        }
    )

    userTbl.associate = function (models) { };
    userTbl.isCorrectPassword = async function (id, password, callback) {
        await userTbl.findOne({
            where: { id }
        })
            .then((userObj) => {
                bcrypt.compare(password, userObj?.password, function (err, same) {
                    if (err) {
                        callback(err)
                    } else {
                        callback(err, same)
                    }
                })
            })
            .catch((err) => {
                callback(err)
            })
    }
    return userTbl
}