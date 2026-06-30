const { sequelize, studentAttendanceTbl, userTbl, studentTbl } = require('./sequelize.js');

async function seed() {
  try {
    await sequelize.sync();
    
    // Check if attendance already seeded
    const existing = await studentAttendanceTbl.count();
    if (existing > 0) {
      console.log("Attendance already seeded.");
      return;
    }

    // Get a student that the parent can see. From previous exploration, parent 9847457348 has student 3.
    // Parent 9897987987 has student 2.
    // Let's seed for student 2 and 3 for the past 7 days.
    const studentIds = [2, 3];

    for (const studentId of studentIds) {
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Randomize punch in between 08:00 and 08:30
            const punchInHr = 8;
            const punchInMin = Math.floor(Math.random() * 30);
            const punchInStr = `${punchInHr.toString().padStart(2, '0')}:${punchInMin.toString().padStart(2, '0')}:00`;

            // Randomize punch out between 14:00 and 15:00
            const punchOutHr = 14;
            const punchOutMin = Math.floor(Math.random() * 60);
            const punchOutStr = `${punchOutHr.toString().padStart(2, '0')}:${punchOutMin.toString().padStart(2, '0')}:00`;

            const isLate = punchInMin > 15;
            let status = isLate ? 'Late' : 'Present';
            
            if (Math.random() > 0.8) {
                status = 'Absent';
            }

            await studentAttendanceTbl.create({
                studentIdFk: studentId,
                date: dateStr,
                punchIn: status === 'Absent' ? null : punchInStr,
                punchOut: status === 'Absent' ? null : punchOutStr,
                status: status
            });
        }
    }
    console.log("Seeded fake attendance data!");
  } catch(e) {
    console.error(e);
  }
}
seed();
