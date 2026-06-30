const { boardSubjectConditionsTbl } = require("./sequelize.js");

async function run() {
  // SSC - 9th - Marathi Medium
  const newCondition = {
    name: 'SSC - 9th - Marathi Medium',
    boardIdFk: 1,
    standardIdFk: 5,
    mediumIdFk: 3,
    minSubjectsSelectable: 1,
    maxSubjectsSelectable: 10,
    selectionType: 'range',
    conditionMeta: { rules: [] },
    extraCondition: null
  };

  const [record, created] = await boardSubjectConditionsTbl.findOrCreate({
    where: {
      boardIdFk: 1,
      standardIdFk: 5,
      mediumIdFk: 3
    },
    defaults: newCondition
  });

  if (created) {
    console.log("Successfully created:", record.toJSON());
  } else {
    console.log("Already exists:", record.toJSON());
  }
}

run().catch(console.error);
