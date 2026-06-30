const { getNextRoll } = require('./lib/studentRollNo.utils.js');
for (let board of ["HSC", "SSC", "CBSE", "ICSE"]) {
    let last = null;
    let generated = new Set();
    for(let i = 1; i <= 200; i++) {
        const next = getNextRoll(board, last);
        if(generated.has(next)) {
            console.log(`Self Duplicate! Board: ${board}, Record: ${i}, Roll: ${next}`);
            break;
        }
        generated.add(next);
        last = next;
    }
}
