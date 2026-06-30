'use strict';


module.exports = (sequelize, DataTypes) => {
  const studentFeesTbl = sequelize.define(
    'tbl_student_fees',
    {
      id: {
        field: 'student_fee_id_pk',
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
        comment: 'FK to tbl_students(id)'
      },
      amountPaid: {
        field: 'amount_paid',
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Amount paid by the student'
      },
      paymentDate: {
        field: 'payment_date',
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date of payment'
      },
      transactionReference: {
        field: 'transaction_reference',
        type: DataTypes.STRING(128),
        allowNull: true,
        comment: 'Transaction reference number'
      },
      paymentMethod: {
        field: 'payment_method',
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'Payment method (cash, online, cheque, etc.)'
      },
      status: {
        field: 'status',
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '1=active, 0=inactive'
      }
    }
  );

  studentFeesTbl.associate = function (models) {
  };

  return studentFeesTbl;
};
