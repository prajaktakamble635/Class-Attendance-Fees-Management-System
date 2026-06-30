const {
  boardsTbl,
  standardsTbl,
  mediumsTbl,
  boardSubjectConditionsTbl,
  sequelize
} = require('./sequelize.js');

async function seedHsc() {
  try {
    await sequelize.sync();

    // 1. Board
    const [hscBoard] = await boardsTbl.findOrCreate({
      where: { code: 'HSC' },
      defaults: { code: 'HSC', name: 'HSC' } // Or 'State Board' if needed, but user said 'HSC'
    });

    // 2. Standards
    const stdData = [
      { code: 'STD11', name: '11th' },
      { code: 'STD12', name: '12th' },
    ];
    const stds = {};
    for (const s of stdData) {
      const [std] = await standardsTbl.findOrCreate({ where: { code: s.code }, defaults: s });
      stds[s.name] = std;
    }

    // 3. Mediums (Streams)
    const streamData = [
      { name: 'Commerce', boardIdFk: hscBoard.id },
      { name: 'Science', boardIdFk: hscBoard.id },
    ];
    const streams = {};
    for (const m of streamData) {
      const [stream] = await mediumsTbl.findOrCreate({
        where: { name: m.name, boardIdFk: m.boardIdFk },
        defaults: m
      });
      streams[m.name] = stream;
    }

    // 4. Conditions
    for (const stdName in stds) {
      const std = stds[stdName];
      for (const streamName in streams) {
        const stream = streams[streamName];
        
        const conditionName = `HSC - ${std.name} - ${stream.name}`;
        await boardSubjectConditionsTbl.findOrCreate({
          where: {
            boardIdFk: hscBoard.id,
            standardIdFk: std.id,
            mediumIdFk: stream.id
          },
          defaults: {
            name: conditionName,
            minSubjectsSelectable: 1,
            maxSubjectsSelectable: 10,
            selectionType: 'range',
            conditionMeta: { rules: [] }
          }
        });
        console.log(`Created/Found condition: ${conditionName}`);
      }
    }

    console.log("Seeding HSC complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seedHsc();
