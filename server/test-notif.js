const { Op } = require('sequelize');
const { deviceAttendanceLogsTbl } = require('./sequelize.js');
async function run() {
  const todayStr = new Date().toISOString().split("T")[0];
  const logs = await deviceAttendanceLogsTbl.findAll({
    where: {
      employeeId: '1001',
      punchDatetime: {
        [Op.gte]: new Date(`${todayStr}T00:00:00Z`),
        [Op.lte]: new Date(`${todayStr}T23:59:59Z`)
      }
    }
  });
  console.log(logs.map(l => l.punchDatetime));
  process.exit(0);
}
run();
