const { boardSubjectConditionsTbl, boardsTbl, standardsTbl, mediumsTbl } = require("./sequelize.js");

async function run() {
  const result = await boardSubjectConditionsTbl.findAll({
      include: [
        { model: boardsTbl, as: 'tbl_boards' },
        { model: standardsTbl, as: 'tbl_standards' },
        { model: mediumsTbl, as: 'tbl_mediums' }
      ]
    });

  let data = result.map((item) => ({
      label: item.name,
      value: item.id
  }));

  data.sort((a, b) => {
      const numA = parseInt(a.label.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.label.match(/\d+/)?.[0] || 0);
      return numA - numB;
  });

  console.log("Sorted Data:");
  data.forEach(d => console.log(d.label));
}
run().catch(console.error);
