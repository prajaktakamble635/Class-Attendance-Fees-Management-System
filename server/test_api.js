const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:7002/api/superAdminApi/getAllBoardSubjectConditionData');
    console.log("Total conditions:", res.data.conditionData.length);
    console.log("Conditions:", res.data.conditionData.map(c => c.label));
  } catch (e) { console.error(e.message); }
}
test();
