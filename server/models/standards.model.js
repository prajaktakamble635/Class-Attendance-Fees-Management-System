'use strict'
module.exports = (sequelize, DataTypes) => {
    const standardsTbl = sequelize.define(
        'tbl_standards',
        {
            id:{
                field:'standards_id_pk',
                type:DataTypes.INTEGER,
                primaryKey:true,
                autoIncrement:true,
                comment:'primary key, auto-increment'
            },
            code:{
                field:'code',
                type:DataTypes.STRING(32),
                unique:true,
                allowNull:false,
                comment:'STD10, STD12'
            },
            name:{
                field:'name',
                type:DataTypes.STRING(64),
                allowNull:false,
                comment:'10th, 12th'
            },
            status:{
                field:'status',
                type:DataTypes.TINYINT,
                defaultValue:1,
                comment:"1 - active, 2 - inactive" 
            }
        },
        {}
    )
    standardsTbl.associate = function(models){}
    return standardsTbl
}