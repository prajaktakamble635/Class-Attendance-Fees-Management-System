const { standardsTbl, mediumsTbl, boardsTbl, boardSubjectConditionsTbl } = require("./sequelize.js");

async function check() {
  const standards = await standardsTbl.findAll({ raw: true, attributes: ['id', 'name'] });
  console.log("Standards:", JSON.stringify(standards));
  
  const mediums = await mediumsTbl.findAll({ raw: true, attributes: ['id', 'name'] });
  console.log("Mediums:", JSON.stringify(mediums));
  
  const boards = await boardsTbl.findAll({ raw: true, attributes: ['id', 'name'] });
  console.log("Boards:", JSON.stringify(boards));
}
check().catch(console.error);
