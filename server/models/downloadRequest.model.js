'use strict'
module.exports = (sequelize, DataTypes) => {
    const downloadRequestTbl = sequelize.define(
        "tbl_download_request",
        {
            id: {
                field: 'download_request_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: 'primary key, auto-incremented'
            },
            label: {
                field: 'label',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            description: {
                field: 'description',
                type: DataTypes.TEXT,
                allowNull: true
            },
            otp: {
                field: 'otp',
                type: DataTypes.STRING(10),
                allowNull: false,
            },
            expiresAt: {
                field: 'expires_at',
                type: DataTypes.DATE,
                allowNull: false,
            },
            isUsed: {
                field: 'is_used',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1 - not-used, 2 - used'
            },
            employeeIdFk: {
                field: 'employee_id_fk',
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'user_id_pk'
                },
                comment: "user table reference"
            }
        }
    )

    downloadRequestTbl.associate = function (models) { }
    return downloadRequestTbl
}