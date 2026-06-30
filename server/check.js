const { userTbl } = require("./sequelize.js");
async function run() {
  const users = await userTbl.findAll({ where: { userRole: 5 }});
  console.log("Total parents:", users.length);
  if(users.length > 0) {
     console.log(users[0].toJSON());
  }
  process.exit();
}
run();
