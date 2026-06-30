const { getNextRoll } = require('./lib/studentRollNo.utils.js');

function simulate(boardName, count) {
    let last = null;
    const generated = new Set();
    for (let i = 0; i < count; i++) {
        const next = getNextRoll(boardName, last);
        if (generated.has(next)) {
            console.log(`DUPLICATE IN ${boardName} at index ${i}: ${next}`);
            break;
        }
        generated.add(next);
        last = next;
    }
    console.log(`${boardName} Last after ${count}: ${last}`);
    return generated;
}

const ssc = simulate("SSC", 200);
const hsc = simulate("HSC", 200);
const cbse = simulate("CBSE", 200);
const icse = simulate("ICSE", 200);

// Check for cross-board duplicates
for (const roll of ssc) {
    if (hsc.has(roll)) console.log("Cross dup SSC/HSC:", roll);
    if (cbse.has(roll)) console.log("Cross dup SSC/CBSE:", roll);
    if (icse.has(roll)) console.log("Cross dup SSC/ICSE:", roll);
}
for (const roll of hsc) {
    if (icse.has(roll)) console.log("Cross dup HSC/ICSE:", roll);
}
