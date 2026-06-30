'use strict'
module.exports = (sequelize, DataTypes) => {
    const studentFeesInstallmentsTbl = sequelize.define(
        'tbl_student_fees_installments',
        {
            id: {
                field: 'student_installments_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: 'primary key, auto-incremented'
            },
            installmentNo: {
                field: 'installment_no',
                type: DataTypes.INTEGER,
                allowNull: true
            },
            amount: {
                field: 'amount',
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0.0,
                allowNull: true
            },
            dueDate: {
                field: 'due_date',
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            paymentDate: {
                field: 'payment_date',
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            totalFees: {
                field: 'total_fees',
                type: DataTypes.INTEGER,
                defaultValue: null,
                allowNull: true
            },
            paidStatus: {
                field: 'paid_status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: "1 - Pending, 2 - Paid, 3 - Overdue"
            },
            paidAmount: {
                field: 'paid_amount',
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0.0,
                allowNull: true,
                comment: 'How much is paid for this installment',
            },

            studentIdFk: {
                field: "student_id_fk",
                type: DataTypes.INTEGER,
                references: {
                    model: 'tbl_students',
                    key: 'student_id_pk'
                },
                comment: "student table reference"
            }
        }, {}
    )

    studentFeesInstallmentsTbl.associate = function (models) { }
    return studentFeesInstallmentsTbl

}