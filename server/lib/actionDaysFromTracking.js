const { leadsTrackingTbl } = require("../sequelize");

const getActionDaysFromTracking = async (leadId) => {
  if (!leadId) return 0;

  const lastTracking = await leadsTrackingTbl.findOne({
    where: { leadsIdFk: leadId },
    order: [['createdAt', 'DESC']],
  });

  if (!lastTracking || !lastTracking.createdAt) return 0;

  const lastDate = new Date(lastTracking.createdAt);
  const now = new Date();

  const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = nowDateOnly - lastDateOnly;
  const actionDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return actionDays;
};

module.exports = getActionDaysFromTracking;
