'use strict'
module.exports = (sequelize, DataTypes) => {
    const mediumsTbl = sequelize.define(
        'tbl_mediums',
        {
            id:{
                field:'mediums_id_pk',
                type:DataTypes.INTEGER,
                primaryKey:true,
                autoIncrement:true,
                comment:'primary key, auto-incremented'
            },
            name:{
                field:'name',
                type:DataTypes.STRING(64),
                allowNull:false,
                comment:'English, Semi-English'
            },
            boardIdFk:{
                field:'board_id_fk',
                type:DataTypes.INTEGER,
                allowNull:false,
                references:{
                    model:'tbl_boards',
                    key:'board_id_pk'
                },
                comment:'boards table reference'
            },
            status:{
                field:'status',
                type:DataTypes.INTEGER,
                defaultValue:1,
                comment:'1 - active, 2 - inactive'
            }
        },{}
    )
    mediumsTbl.associate = function(models){}
    return mediumsTbl
}