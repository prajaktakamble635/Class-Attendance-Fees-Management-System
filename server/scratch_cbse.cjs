const { boardSubjectConditionsTbl, standardsTbl, boardsTbl, mediumsTbl } = require('./sequelize.js');
boardSubjectConditionsTbl.findAll({
  include: [
    { model: standardsTbl, as: 'tbl_standards' },
    { model: boardsTbl, as: 'tbl_boards' },
    { model: mediumsTbl, as: 'tbl_mediums' }
  ]
}).then(res => {
  const data = res.map(obj => {
    const plainObj = obj.get({ plain: true });
    return {
      boardName: plainObj.tbl_boards?.name,
      standard: plainObj.tbl_standards?.name,
      medium: plainObj.tbl_mediums?.name,
    }
  });
  console.log("CBSE conditions:", data.filter(d => d.boardName === 'CBSE'));
});
