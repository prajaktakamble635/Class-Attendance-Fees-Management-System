'use strict';

module.exports = (sequelize, DataTypes) => {
  const studentTbl = sequelize.define("tbl_students", {
    id: {
      field: "student_id_pk",
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: "Primary key, auto-incremented",
    },
    firstName: {
      field: "first_name",
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    motherName: {
      field: "mother_name",
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fatherName: {
      field: "father_name",
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    surname: {
      field: "surname",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      field: "address",
      type: DataTypes.TEXT,
      allowNull: true,
    },
    schoolName: {
      field: "school_name",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fatherOccupation: {
      field: "father_occupation",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    motherOccupation: {
      field: "mother_occupation",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    studentMobile: {
      field: "student_mobile",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    studentWhatsapp: {
      field: "student_whatsapp",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fatherMobile: {
      field: "father_mobile",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fatherWhatsapp: {
      field: "father_whatsapp",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    motherMobile: {
      field: "mother_mobile",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    motherWhatsapp: {
      field: "mother_whatsapp",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      field: "email",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dob: {
      field: "dob",
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      field: "gender",
      type: DataTypes.ENUM("M", "F", "O"),
      allowNull: true,
    },
    standardIdFk: {
      field: "standards_id_fk",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_standards",
        key: "standards_id_pk",
      },
      comment: "FK to tbl_standards(id)",
    },
    boardIdFk: {
      field: "board_id_fk",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_boards",
        key: "board_id_pk",
      },
      comment: "FK to tbl_boards(id)",
    },
    mediumIdFk: {
      field: "mediums_id_fk",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_mediums",
        key: "mediums_id_pk",
      },
      comment: "FK to tbl_mediums(id)",
    },
    boardSubjectConditionsId: {
      field: "board_subject_conditions_id",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    photoPath: {
      field: "photo_path",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    rollNo: {
      field: "roll_no",
      type: DataTypes.STRING(48),
      allowNull: true,
      unique: true,
      comment: "Auto-generated like YC[CLASS][BOARD][NNN]",
    },
    admissionConfirmed: {
      field: "admission_confirmed",
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1-YES, 2-NO",
    },
    isCombination: {
      field: "is_combination",
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: "When multiple sets selected",
    },
    addons: {
      field: "addons",
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Comma separated addons",
    },
    discount: {
      field: 'discount',
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    totalFees: {
      field: 'total_fees',
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    paymentType: {
      field: 'payment_type',
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: "1 - ontime, 2 - installment"
    },
    noOfInstallment: {
      field: 'no_of_installment',
      type: DataTypes.INTEGER,
      defaultValue: null,
      allowNull: true
    },
    installments: {
      field: 'installments',
      type: DataTypes.JSON,
      defaultValue: null,
      allowNull: true,
      comment: '[{ installment_no, amount, due_date, paid_status, paid_date }]',
    },
    feesPaid: {
      field: "fees_paid",
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    feesRemaining: {
      field: "fees_remaining",
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    feesPaidStatus: {
      field: 'fees_paid_status',
      type: DataTypes.TINYINT,
      defaultValue: 2,
      comment: '1 - paid, 2 - pending'
    },
    oneTimePaymentDate: {
      field: 'one_time_payment_date',
      type: DataTypes.DATEONLY,
      defaultValue: null,
      allowNull: true
    },
    registrationCharges: {
      field: "registration_charges",
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "One-time registration charge",
    },
    admissionDate: {
      field: 'admission_date',
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    createdBy: {
      field: "created_by",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_user",
        key: "user_id_pk",
      },
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      field: "updated_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      field: "status",
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1=active, 2=inactive, 3=deleted/blocked",
    },
  });

  studentTbl.associate = function (models) { };

  return studentTbl;
};
