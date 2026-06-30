const { userTbl } = require("./sequelize.js");
const parentController = require("./controllers/parent.controller");

async function run() {
  const req = { uid: 3 }; // using the user id from earlier (id: 3)
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { console.log(this.statusCode, JSON.stringify(data, null, 2)); return this; }
  };
  
  await parentController.getDashboardDetails(req, res);
  process.exit();
}
run();
