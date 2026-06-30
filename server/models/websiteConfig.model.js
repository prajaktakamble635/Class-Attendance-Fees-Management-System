'use strict'
module.exports = (sequelize, DataTypes) => {
  const websiteConfigTbl = sequelize.define(
    'tbl_website_config',
    {
      id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Auto generated key'
      },
      documentUploadCounter: {
        field: 'document_upload_counter',
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'document upload counter'
      }
    },
    {}
  )
  // noinspection JSUnusedLocalSymbols
  websiteConfigTbl.associate = function (models) {
    // associations can be defined here
  }
  return websiteConfigTbl
}
