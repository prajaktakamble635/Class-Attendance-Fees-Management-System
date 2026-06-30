"use strict";
const wlogger = require('../logger')
const { leadsTbl, userTbl } = require('../sequelize')
const Sequelize = require("sequelize");
const Op = Sequelize.Op

async function accountValidation(accountNo, productIdFk, level1SubProductIdFk, level2SubProductIdFk, branchIdFk, leadsIdFk = 0) {
	try {
		let level2Id = null;
		if (level2SubProductIdFk) level2Id = level2SubProductIdFk;

		const statusList = [2, 3, 6]; // Only consider these statuses
		if(productIdFk === 2 && level1SubProductIdFk === 3) {
			// * allow duplicate account no
			return { isAllowed: true, staffName: '' };
		}
		else if(leadsIdFk === 0){
			// New lead - check if another lead exists with the same accountNo and details
			const existingLead = await leadsTbl.findOne({
				where: {
					accountNo,
					productIdFk,
					level1SubProductIdFk,
					level2SubProductIdFk: level2Id,
					branchIdFk,
					status: {
						[Op.in]: statusList
					}
				},
				include: [
					{
						model: userTbl,
						as: 'tbl_assigned_user',
						attributes: ['id', 'name']
					},
				]
			});

			if (existingLead) {
				const staffName = existingLead.tbl_assigned_user[0]?.name || '';
				const leadId = existingLead.id || null;
				return { isAllowed: false, staffName, leadId };
			}
			return { isAllowed: true, staffName: '', leadId: null};
		}
		else {
			// * Edit existing lead - check others excluding current one
			const existingLead = await leadsTbl.findOne({
				where: {
					accountNo,
					productIdFk,
					level1SubProductIdFk,
					level2SubProductIdFk: level2Id,
					branchIdFk,
					id: {
						[Op.ne]: leadsIdFk
					},
					status: {
						[Op.in]: statusList
					}
				},
				include: [
					{
						model: userTbl,
						as: 'tbl_assigned_user',
						attributes: ['id', 'name']
					},
				]
			});

			if (existingLead) {
				const staffName = existingLead.tbl_assigned_user[0]?.name || '';
				const leadId = existingLead.id || null;
				return { isAllowed: false, staffName, leadId };
			}
			return { isAllowed: true, staffName: '', leadId: null};
		}
	}
	catch (err) {
		wlogger.info('accountValidation: ', err);
		return { isAllowed: true, staffName: '' };
	}
}

module.exports = accountValidation;