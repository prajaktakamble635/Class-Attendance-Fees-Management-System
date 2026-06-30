const axios = require('axios');
axios.get('http://localhost:7002/api/commonApi/boardSubjectConditions')
  .then(res => console.log(JSON.stringify(res.data.data.slice(0, 5), null, 2)))
  .catch(err => console.log(err.response ? err.response.status : err.message));
