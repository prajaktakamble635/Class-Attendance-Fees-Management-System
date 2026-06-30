const {
  boardsTbl,
  standardsTbl,
  mediumsTbl,
  boardSubjectConditionsTbl,
  sequelize
} = require('./sequelize.js');

async function seedData() {
  try {
    await sequelize.sync();
    console.log("Database synced");

    // 1. Boards
    const boardsData = [
      { code: 'SSC', name: 'State Board' },
      { code: 'CBSE', name: 'CBSE Board' },
      { code: 'ICSE', name: 'ICSE Board' },
    ];
    const boards = {};
    for (const b of boardsData) {
      const [board] = await boardsTbl.findOrCreate({ where: { code: b.code }, defaults: b });
      boards[b.code] = board;
    }

    // 2. Standards
    const standardsData = [
      { code: 'STD7', name: '7th' },
      { code: 'STD8', name: '8th' },
      { code: 'STD9', name: '9th' },
      { code: 'STD10', name: '10th' },
    ];
    const standards = {};
    for (const s of standardsData) {
      const [standard] = await standardsTbl.findOrCreate({ where: { code: s.code }, defaults: s });
      standards[s.code] = standard;
    }

    // 3. Mediums (only for SSC as requested: "for ssc then english semi and english medium")
    const mediumsData = [
      { name: 'English Medium', boardIdFk: boards['SSC'].id },
      { name: 'Semi English Medium', boardIdFk: boards['SSC'].id },
    ];
    const mediums = {};
    for (const m of mediumsData) {
      const [medium] = await mediumsTbl.findOrCreate({ 
        where: { name: m.name, boardIdFk: m.boardIdFk }, 
        defaults: m 
      });
      mediums[m.name] = medium;
    }

    // 4. BoardSubjectConditions
    // We need to create conditions for:
    // SSC - 7th, 8th, 9th, 10th - English Medium
    // SSC - 7th, 8th, 9th, 10th - Semi English Medium
    // CBSE - 7th, 8th, 9th, 10th (no medium specified, assume null or create a default one if required by logic. Wait, mediums are nullable. So null.)
    // ICSE - 7th, 8th, 9th, 10th (no medium specified, null)

    for (const stdKey in standards) {
      const std = standards[stdKey];

      // SSC
      for (const medName in mediums) {
        const med = mediums[medName];
        const name = `SSC - ${std.name} - ${med.name}`;
        await boardSubjectConditionsTbl.findOrCreate({
          where: {
            boardIdFk: boards['SSC'].id,
            standardIdFk: std.id,
            mediumIdFk: med.id
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

      // CBSE
      const cbseName = `CBSE - ${std.name}`;
      await boardSubjectConditionsTbl.findOrCreate({
        where: {
          boardIdFk: boards['CBSE'].id,
          standardIdFk: std.id,
          mediumIdFk: null
        },
        defaults: {
          name: cbseName,
          minSubjectsSelectable: 1,
          maxSubjectsSelectable: 10,
          selectionType: 'range',
          conditionMeta: { rules: [] }
        }
      });
      console.log(`Created/Found condition: ${cbseName}`);

      // ICSE
      const icseName = `ICSE - ${std.name}`;
      await boardSubjectConditionsTbl.findOrCreate({
        where: {
          boardIdFk: boards['ICSE'].id,
          standardIdFk: std.id,
          mediumIdFk: null
        },
        defaults: {
          name: icseName,
          minSubjectsSelectable: 1,
          maxSubjectsSelectable: 10,
          selectionType: 'range',
          conditionMeta: { rules: [] }
        }
      });
      console.log(`Created/Found condition: ${icseName}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

seedData();
