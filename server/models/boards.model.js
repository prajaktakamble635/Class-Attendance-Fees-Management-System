'use strict'
module.exports = (sequelize, DataTypes) => {
    const boardsTbl = sequelize.define(
        'tbl_boards',
        {
            id:{
                field:'board_id_pk',
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
                comment:'CBSE, ICSE, SSC, HSC'
            },
            name:{
                field:'name',
                type:DataTypes.STRING(128),
                allowNull:false 
            },
            rollNoSeries:{
                field:'roll_no_series',
                type:DataTypes.INTEGER,
                defaultValue:1
            },
            hallTicketColor:{
                field:'hall_ticket_color',
                type:DataTypes.STRING(62),
                allowNull:true,
                defaultValue:null,
                comment:"color hex-code"
            },
            status:{
                field:'status',
                type:DataTypes.TINYINT,
                defaultValue:1
            }
        },{}
    )

    boardsTbl.associate = function(models){};
    return boardsTbl
}