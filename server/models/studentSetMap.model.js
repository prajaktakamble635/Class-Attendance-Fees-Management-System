'use strict';

module.exports = (sequelize, DataTypes) => {
  const studentSetMapTbl = sequelize.define(
    'tbl_student_set_map',
    {
      id: {
        field: 'student_set_map_id_pk',
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
      setIdFk: {
        field: 'set_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_sets',
          key: 'set_id_pk'
        },
        comment: 'FK to tbl_sets(id)'
      },
      createdAt: {
        field: 'created_at',
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Record creation timestamp'
      }
    },
    {
      tableName: 'tbl_student_set_map',
      timestamps: false,
      comment: 'Mapping table when student selects multiple sets (combination)',
      indexes: [
        {
          unique: true,
          fields: ['student_id_fk', 'set_id_fk'],
          name: 'idx_unique_student_set'
        },
        {
          unique: false,
          fields: ['student_id_fk'],
          name: 'idx_student_id'
        },
        {
          unique: false,
          fields: ['set_id_fk'],
          name: 'idx_set_id'
        }
      ]
    }
  );

  studentSetMapTbl.associate = function (models) {};

  return studentSetMapTbl;
};
