'use strict';

module.exports = (sequelize, DataTypes) => {
  const boardSubjectConditionsTbl = sequelize.define(
    'tbl_board_subject_conditions',
    {
      id: {
        field: 'board_subject_condition_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Primary key, auto-incremented'
      },
        name: {
        field: 'name',
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Name/label '
      },
      boardIdFk: {
        field: 'board_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_boards',
          key: 'board_id_pk'
        },
        comment: 'FK to tbl_boards(id)'
      },
      standardIdFk: {
        field: 'standards_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_standards',
          key: 'standards_id_pk'
        },
        comment: 'FK to tbl_standards(id)'
      },
      mediumIdFk: {
        field: 'mediums_id_fk',
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_mediums',
          key: 'mediums_id_pk'
        },
        comment: 'FK to tbl_mediums(id), nullable'
      },
      minSubjectsSelectable: {
        field: 'min_subjects_selectable',
        type: DataTypes.TINYINT,
        allowNull: true,
        comment: 'Minimum subjects a student must select for this combination'
      },
      maxSubjectsSelectable: {
        field: 'max_subjects_selectable',
        type: DataTypes.TINYINT,
        allowNull: true,
        comment: 'Maximum subjects allowed to be selected for this combination'
      },
      selectionType: {
        field: 'selection_type',
        type: DataTypes.ENUM('fixed', 'range', 'choose_n_from_group'),
        defaultValue: 'range',
        comment: `'fixed' = exact selection (min=max), 'range' = between min & max inclusive, 'choose_n_from_group' = use with extra_condition`
      },
      conditionMeta: {
        field: 'condition_meta',
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'optional structured metadata for complex conditions (example format documented below)'
      },
      extraCondition: {
        field: 'extra_condition',
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'optional human-readable note or legacy rule text'
      },
     
    },
   
  );


   boardSubjectConditionsTbl.associate = function (models) { }
    return boardSubjectConditionsTbl
};
