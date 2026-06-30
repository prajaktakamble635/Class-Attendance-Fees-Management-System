'use strict';

module.exports = (sequelize, DataTypes) => {
    const studentAttendanceTbl = sequelize.define(
        'tbl_student_attendance',
        {
            id: {
                field: 'attendance_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: 'Primary key, auto-incremented'
            },
            studentIdFk: {
                field: 'student_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'tbl_students',
                    key: 'student_id_pk'
                },
                onDelete: 'CASCADE',
                comment: 'FK to tbl_students(id)'
            },
            date: {
                field: 'date',
                type: DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Date of attendance'
            },
            punchIn: {
                field: 'punch_in',
                type: DataTypes.TIME,
                allowNull: true,
                comment: 'Biometric punch in time'
            },
            punchOut: {
                field: 'punch_out',
                type: DataTypes.TIME,
                allowNull: true,
                comment: 'Biometric punch out time'
            },
            status: {
                field: 'status',
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'Present',
                comment: 'Present, Absent, Late, Half-day'
            }
        },
        {}
    );

    studentAttendanceTbl.associate = function (models) {
    };

    return studentAttendanceTbl;
};
