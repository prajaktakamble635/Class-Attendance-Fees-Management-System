const { standardsTbl, mediumsTbl, boardsTbl, boardSubjectConditionsTbl } = require("./sequelize.js");

async function check() {
  const standards = await standardsTbl.findAll({ raw: true });
  console.log("Standards:", standards);
  
  const mediums = await mediumsTbl.findAll({ raw: true });
  console.log("Mediums:", mediums);
  
  const boards = await boardsTbl.findAll({ raw: true });
  console.log("Boards:", boards);
  
  const conditions = await boardSubjectConditionsTbl.findAll({ raw: true });
  console.log("Conditions:", conditions);
}
check().catch(console.error);
