'use strict';

module.exports = (sequelize, DataTypes) => {
  const hallTicketsTbl = sequelize.define(
    'tbl_hall_tickets',
    {
      id: {
        field: 'hall_ticket_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Primary key, auto-incremented',
      },
      examSessionIdFk: {
        field: 'exam_session_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_exam_sessions',
          key: 'exam_session_id_pk',
        },
        comment: 'FK to tbl_exam_sessions(id)',
      },
      pdfPath: {
        field: 'pdf_path',
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'File path of the generated hall ticket PDF',
      },
      generatedAt: {
        field: 'generated_at',
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp when hall ticket was generated',
      },
      generatedByFk: {
        field: 'generated_by_fk',
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_user',
          key: 'user_id_pk',
        },
        comment: 'FK to tbl_users(id) who generated the ticket',
      },
      status: {
        field: 'status',
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '1=Active, 0=Inactive',
      },
    },
    {
      
    }
  );

  hallTicketsTbl.associate = function (models) {
  };

  return hallTicketsTbl;
};
