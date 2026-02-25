const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/analytics.ts', 'utf8');

// Replace status logic in Dashboard
code = code.replace(/prisma\.attendance\.count\(\{\s*where:\s*\{\s*date:\s*startOfDay,\s*status:\s*\{\s*in:\s*\['PRESENT',\s*'LATE'\]\s*\}\s*\}\s*\}\)/g, 
  `prisma.attendance.count({ where: { date: startOfDay, checkIn: { not: null } } })`);

// Replace user.name with user.firstName and user.lastName
code = code.replace(/user:\s*\{\s*select:\s*\{\s*name:\s*true\s*\}\s*\}/g, `user: { select: { firstName: true, lastName: true } }`);
code = code.replace(/user:\s*\{\s*select:\s*\{\s*name:\s*true,\s*email:\s*true\s*\}\s*\}/g, `user: { select: { firstName: true, lastName: true, email: true } }`);

code = code.replace(/e\.user\.name/g, '`${e.user.firstName} ${e.user.lastName}`');
code = code.replace(/t\.assignee\?\.user\.name/g, 't.assignee ? `${t.assignee.user.firstName} ${t.assignee.user.lastName}` : null');
code = code.replace(/a\.employee\.user\.name/g, '`${a.employee.user.firstName} ${a.employee.user.lastName}`');
code = code.replace(/l\.employee\.user\.name/g, '`${l.employee.user.firstName} ${l.employee.user.lastName}`');
code = code.replace(/task\.assignee\?\.user\.name/g, 'task.assignee ? `${task.assignee.user.firstName} ${task.assignee.user.lastName}` : null');


// Replace status aggregations
code = code.replace(/const attendanceStats = await prisma\.attendance\.groupBy\(\{\s*by:\s*\['status'\],/g, `const attendanceStats = await prisma.attendance.groupBy({ by: ['isLate', 'isHalfDay', 'isWFH'],`);
code = code.replace(/attendanceStats\.forEach\(stat => \{\s*totalAttendance \+= stat\._count\.id;\s*if \(stat\.status === 'PRESENT' \|\| stat\.status === 'LATE'\) \{\s*presentAttendance \+= stat\._count\.id;\s*\}\s*\}\);/g, `attendanceStats.forEach(stat => { totalAttendance += stat._count.id; presentAttendance += stat._count.id; /* Simplified for active attendance records */ });`);

// Replace status analytics route logic
code = code.replace(/,\s*prisma\.attendance\.groupBy\(\{\s*by:\s*\['status'\],\s*_count:\s*\{\s*id:\s*true\s*\},\s*where\s*\}\)/g, ` `);

// attendance api modifications
code = code.replace(/const \[attendanceRecords, stats\] \= await Promise\.all\(\[/g, `const attendanceRecords = await prisma.attendance.findMany({
        where,
        include: {
          employee: {
            include: {
              user: { select: { firstName: true, lastName: true } }
            }
          }
        },
        orderBy: { date: 'desc' }
      });`);
code = code.replace(/prisma\.attendance\.findMany\([\s\S]*?orderBy: \{ date: 'desc' \}\s*\}\),\s*\]\);/g, "");

code = code.replace(/const statusCounts: Record<string, number> = \{\};[\s\S]*?const absentCount = statusCounts\['ABSENT'\] \|\| 0;/g, `
    const presentCount = attendanceRecords.filter((r) => r.checkIn).length;
    const lateCount = attendanceRecords.filter((r) => r.isLate).length;
    const absentCount = attendanceRecords.filter((r) => !r.checkIn).length;`);

code = code.replace(/const dailyStats: Record<string, \{ present: number; absent: number; late: number \}> = \{\};\s*attendanceRecords\.forEach\(record => \{\s*const dateKey = record\.date\.toISOString\(\)\.split\('T'\)\[0\];\s*if \(\!dailyStats\[dateKey\]\) \{\s*dailyStats\[dateKey\] = \{ present: 0, absent: 0, late: 0 \};\s*\}\s*dailyStats\[dateKey\]\[record\.status\.toLowerCase\(\) as 'present' \| 'absent' \| 'late'\]\+\+;\s*\}\);/g, `
    const dailyStats: Record<string, { present: number; absent: number; late: number }> = {};
    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { present: 0, absent: 0, late: 0 };
      }
      if (record.isLate) dailyStats[dateKey].late++;
      if (record.checkIn) dailyStats[dateKey].present++;
      else dailyStats[dateKey].absent++;
    });`);

code = code.replace(/status: a\.status,/g, `status: a.checkIn ? (a.isLate ? 'LATE' : 'PRESENT') : 'ABSENT',`);

fs.writeFileSync('backend/src/routes/analytics.ts', code);
