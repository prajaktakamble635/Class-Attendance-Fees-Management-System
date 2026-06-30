'use strict';

module.exports = (sequelize, DataTypes) => {
    const studentSubjectsTbl = sequelize.define(
        'tbl_student_subjects',
        {
            id: {
                field: 'student_subject_id_pk',
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
            subjectIdFk: {
                field: 'subject_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'tbl_subjects',
                    key: 'subject_id_pk'
                },
                comment: 'FK to tbl_subjects(id)'
            },
            isActive: {
                field: 'is_active',
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 1,
                comment: '1 = active, 0 = inactive'
            },
            assignedAt: {
                field: 'assigned_at',
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Timestamp when the subject was assigned'
            },
            assignedBy: {
                field: 'assigned_by',
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'user_id_pk'
                },
                comment: 'FK to tbl_users(id), nullable'
            }
        },
        {

        }
    );

    studentSubjectsTbl.associate = function (models) {
    };

    return studentSubjectsTbl;
};
