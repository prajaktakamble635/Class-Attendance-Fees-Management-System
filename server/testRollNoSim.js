const { getNextRoll } = require('./lib/studentRollNo.utils.js');
let last = { HSC: null, SSC: null, CBSE: null, ICSE: null };
const generated = new Set();

for(let i = 1; i <= 200; i++) {
    for (let board of ["HSC", "SSC", "CBSE", "ICSE"]) {
        const next = getNextRoll(board, last[board]);
        if(generated.has(next)) {
            console.log(`DUPLICATE FOUND! Board: ${board}, Record: ${i}, Roll: ${next}`);
            process.exit(0);
        }
        generated.add(next);
        last[board] = next;
    }
}
console.log("No duplicates found!");
