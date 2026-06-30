const { boardSubjectConditionsTbl, boardsTbl, standardsTbl, mediumsTbl, sequelize } = require('./sequelize.js');

async function check() {
  const conds = await boardSubjectConditionsTbl.findAll();
  for (const c of conds) {
    const board = await boardsTbl.findByPk(c.boardIdFk);
    const standard = await standardsTbl.findByPk(c.standardIdFk);
    const medium = c.mediumIdFk ? await mediumsTbl.findByPk(c.mediumIdFk) : null;
    console.log(`Cond ID: ${c.id} | Board: ${board ? board.name : 'N/A'} | Std: ${standard ? standard.name : 'N/A'} | Med: ${medium ? medium.name : 'N/A'}`);
  }
  process.exit(0);
}

check();
