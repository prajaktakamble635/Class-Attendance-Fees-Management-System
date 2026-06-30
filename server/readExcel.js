// readExcel.js
const XLSX = require('xlsx');
const path = require('path');

const Sequelize = require('sequelize')
const Op = Sequelize.Op
const { userTbl } = require('./sequelize')

// Helper function to parse DD/M/YYYY or DD/MM/YYYY format
function parseDateString(dateString) {
	if (!dateString) return null;

	const parts = dateString.split('/');

	const day = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1; // 0-indexed
	const year = parseInt(parts[2], 10);

	if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

	return new Date(year, month, day);
}

async function readExcelFromSecondRow() {
	const filePath = path.join(__dirname, 'Employee.xlsx');
	const workbook = XLSX.readFile(filePath);
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];
	const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

	for (let i = 1; i < data.length; i++) {
		const row = data[i];

		const staffCode = row[0];
		const joiningDateStr = row[21];

		//* Check Department
		const userTblObj = await userTbl.findOne({
			where: {
				staffCode: `${staffCode}`
			}
		})
		if(userTblObj && joiningDateStr) {
				const parsedDate = parseDateString(joiningDateStr);
			if (parsedDate instanceof Date && !isNaN(parsedDate)) {
				await userTblObj.update({ joiningDate: parsedDate });
				console.log(`Updated joiningDate for ${staffCode}: ${parsedDate.toISOString().split('T')[0]}`);
			} else {
				console.warn(`Invalid date for ${staffCode}: ${joiningDateStr}`);
			}
		}
		else {
			console.log('Staff not found: '+staffCode)
		}
	}
}

module.exports = readExcelFromSecondRow;
