const { boardSubjectConditionsTbl, boardsTbl, standardsTbl, mediumsTbl, subjectsTbl, sequelize } = require('./sequelize.js');

const seedSubjects = async () => {
  try {
    const conds = await boardSubjectConditionsTbl.findAll();

    const subs7_8 = ["English", "Maths", "Science", "History", "Geography", "Marathi", "Hindi", "Sanskrit"];
    const subs9_10 = ["English", "Maths I", "Maths II", "Science I", "Science II", "History / Political Science", "Geography / Economics", "Marathi", "Hindi", "Sanskrit"];
    const subsCommerce = ["Accountancy", "English", "OCM (Organization of Commerce & Management)", "Economics", "SP (Secretarial Practice)", "Maths"];
    const subsScience = ["Physics", "Chemistry", "Maths", "Biology"];

    let count = 0;

    for (const c of conds) {
      const standard = await standardsTbl.findByPk(c.standardIdFk);
      const medium = c.mediumIdFk ? await mediumsTbl.findByPk(c.mediumIdFk) : null;
      
      if (!standard) continue;
      
      const stdName = standard.name.toLowerCase();
      const medName = medium ? medium.name.toLowerCase() : "";

      let subjectsToAdd = [];

      if (stdName.includes("7") || stdName.includes("8")) {
        subjectsToAdd = subs7_8;
      } else if (stdName.includes("9") || stdName.includes("10")) {
        subjectsToAdd = subs9_10;
      } else if (stdName.includes("11") || stdName.includes("12")) {
        if (medName.includes("commerce")) {
          subjectsToAdd = subsCommerce;
        } else if (medName.includes("science")) {
          subjectsToAdd = subsScience;
        }
      }

      if (subjectsToAdd.length > 0) {
        for (const subName of subjectsToAdd) {
          // Check if subject already exists for this condition
          const existing = await subjectsTbl.findOne({
            where: {
              name: subName,
              boardSubjectConditionsId: c.id
            }
          });

          if (!existing) {
            const code = subName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
            
            await subjectsTbl.create({
              code: code,
              name: subName,
              boardIdFK: c.boardIdFk,
              standardIdFk: c.standardIdFk,
              mediumIdFk: c.mediumIdFk,
              boardSubjectConditionsId: c.id,
              isCompulsory: 0,
              status: 1
            });
            count++;
          }
        }
      }
    }

    console.log(`Successfully added ${count} new subjects!`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
};

setTimeout(() => {
  seedSubjects();
}, 1000);
