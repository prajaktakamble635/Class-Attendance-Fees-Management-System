const {
  boardsTbl,
  standardsTbl,
  mediumsTbl,
  boardSubjectConditionsTbl,
  sequelize
} = require('./sequelize.js');

async function seedMarathi() {
  try {
    await sequelize.sync();

    const board = await boardsTbl.findOne({ where: { code: 'SSC' } });
    if (!board) throw new Error("SSC Board not found");

    const standards = await standardsTbl.findAll({ 
      where: { code: ['STD7', 'STD8', 'STD9', 'STD10'] } 
    });

    const [marathiMedium] = await mediumsTbl.findOrCreate({
      where: { name: 'Marathi Medium', boardIdFk: board.id },
      defaults: { name: 'Marathi Medium', boardIdFk: board.id }
    });

    for (const std of standards) {
      const name = `SSC - ${std.name} - ${marathiMedium.name}`;
      await boardSubjectConditionsTbl.findOrCreate({
        where: {
          boardIdFk: board.id,
          standardIdFk: std.id,
          mediumIdFk: marathiMedium.id
        },
        defaults: {
          name: name,
          minSubjectsSelectable: 1,
          maxSubjectsSelectable: 10,
          selectionType: 'range',
          conditionMeta: { rules: [] }
        }
      });
      console.log(`Created/Found condition: ${name}`);
    }

    console.log("Seeding Marathi Medium complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seedMarathi();
