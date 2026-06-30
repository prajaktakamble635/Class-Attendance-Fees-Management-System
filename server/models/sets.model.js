'use strict'
module.exports = (sequelize, DataTypes) => {
    const setsTbl = sequelize.define(
        'tbl_sets',
        {
            id:{
                field:'set_id_pk',
                type:DataTypes.INTEGER,
                primaryKey:true,
                autoIncrement:true,
                comment:"primary key, auto-incremented"
            },
            name:{
                field:'name',
                type:DataTypes.STRING(32),
                allowNull:false,
                comment:"Set 1, Set 2, Set 3, Combination"
            },
            code:{
                field:'code',
                type:DataTypes.STRING(32),
                unique:true,
                allowNull:false 
            },
            status:{
                field:'status',
                type:DataTypes.TINYINT,
                defaultValue:1,
                comment:'1 - active, 2 - inactive'
            }
        },
        {}
    )
    setsTbl.associate = function(models){}
    return setsTbl
}