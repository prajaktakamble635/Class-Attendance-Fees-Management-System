const { getNextRoll } = require('./lib/studentRollNo.utils.js');
console.log("HSC next:", getNextRoll("HSC", "D-3-021"));
console.log("HSC next after:", getNextRoll("HSC", "D-3-022"));
console.log("SSC next:", getNextRoll("SSC", "D-2-036"));
console.log("SSC next after:", getNextRoll("SSC", "D-2-037"));
