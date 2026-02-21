import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../lib/prisma';
const router = Router();
// Get all attendance records
router.get('/', authenticate, async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.query;
        const where = {};
        if (employeeId)
            where.employeeId = employeeId;
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = new Date(startDate);
            if (endDate)
                where.date.lte = new Date(endDate);
        }
        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
        res.json(attendance);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
});
// Get attendance by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await prisma.attendance.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        res.json(attendance);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance record' });
    }
});
// Create attendance record
router.post('/', authenticate, authorize(['ADMIN', 'HR']), async (req, res) => {
    try {
        const { employeeId, date, checkIn, checkOut, status, notes } = req.body;
        const attendance = await prisma.attendance.create({
            data: {
                employeeId,
                date: new Date(date),
                checkIn: checkIn ? new Date(checkIn) : null,
                checkOut: checkOut ? new Date(checkOut) : null,
                status,
                notes,
            },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(201).json(attendance);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create attendance record' });
    }
});
// Update attendance record
router.put('/:id', authenticate, authorize(['ADMIN', 'HR']), async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, status, notes } = req.body;
        const attendance = await prisma.attendance.update({
            where: { id },
            data: {
                checkIn: checkIn ? new Date(checkIn) : undefined,
                checkOut: checkOut ? new Date(checkOut) : undefined,
                status,
                notes,
            },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
        res.json(attendance);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update attendance record' });
    }
});
// Delete attendance record
router.delete('/:id', authenticate, authorize(['ADMIN', 'HR']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.attendance.delete({
            where: { id },
        });
        res.json({ message: 'Attendance record deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete attendance record' });
    }
});
// Get attendance statistics
router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;
        const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0);
        const where = {
            date: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        };
        if (employeeId)
            where.employeeId = employeeId;
        const attendanceRecords = await prisma.attendance.findMany({
            where,
        });
        const stats = {
            present: attendanceRecords.filter((r) => r.status === 'PRESENT').length,
            absent: attendanceRecords.filter((r) => r.status === 'ABSENT').length,
            late: attendanceRecords.filter((r) => r.status === 'LATE').length,
            halfDay: attendanceRecords.filter((r) => r.status === 'HALF_DAY').length,
            onLeave: attendanceRecords.filter((r) => r.status === 'ON_LEAVE').length,
            total: attendanceRecords.length,
        };
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance statistics' });
    }
});
export default router;
//# sourceMappingURL=attendance.js.map