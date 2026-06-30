const { boardSubjectConditionsTbl, boardsTbl, standardsTbl, mediumsTbl, sequelize } = require("./sequelize.js");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

async function run() {
  const result = await boardSubjectConditionsTbl.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%9th%` } }
        ]
      },
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

  console.log("Search for 9th:");
  data.forEach(d => console.log(d.label));
}
run().catch(console.error);
