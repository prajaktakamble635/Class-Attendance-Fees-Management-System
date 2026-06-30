const { getNextRoll } = require('./lib/studentRollNo.utils.js');
let last = null;
const set = new Set();
for(let i = 1; i <= 150; i++) {
    const next = getNextRoll("HSC", last);
    if(set.has(next)) {
        console.log(`Duplicate found at ${i}: ${next}`);
        break;
    }
    set.add(next);
    last = next;
    if(i >= 125) {
        console.log(`${i}: ${next}`);
    }
}
