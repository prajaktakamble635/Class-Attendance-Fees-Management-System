const { Sequelize } = require("sequelize");
const { DB_HOST, DB_PASS, DB_PORT, DB_USER, DB_NAME } = require('./config.js');

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  port: DB_PORT || 3306,
  logging: false,
});

async function run() {
  const [tables] = await sequelize.query("SHOW TABLES");
  console.log(tables);
  process.exit();
}
run();
