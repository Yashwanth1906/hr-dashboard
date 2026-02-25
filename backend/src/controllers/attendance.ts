import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAllAttendance = async (req: any, res: any) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

export const markAttendance = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { isWFH, companyBranchId } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: today, lt: tomorrow }
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ error: "Attendance already marked for today" });
    }

    if (isWFH) {
      const wfhLeave = await prisma.leave.findFirst({
        where: {
          employeeId: employee.id,
          type: 'WFH' as any,
          status: 'APPROVED',
          startDate: { lte: new Date() },
          endDate: { gte: today }
        }
      });

      if (!wfhLeave) {
        return res.status(403).json({ error: "You do not have an approved WFH request for today" });
      }
    } else if (!companyBranchId) {
      return res.status(400).json({ error: "Company branch is required for office attendance" });
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: today,
        checkIn: new Date(),
        isWFH,
        companyBranchId: isWFH ? null : companyBranchId,
        isLate: new Date().getHours() >= 10,
        isHalfDay: false
      }
    });

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

export const checkOut = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { isWFH, companyBranchId, checkoutLat, checkoutLng } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Find the most recent opened checkin that has no checkout
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        checkIn: { not: null },
        checkOut: null
      },
      orderBy: { date: 'desc' }
    });

    if (!existingAttendance) {
      return res.status(400).json({ error: "No active daily attendance found to check out of." });
    }

    // Verify WFH status constraints
    if (isWFH) {
      if (!existingAttendance.isWFH) {
        return res.status(400).json({ error: "You checked in directly at a branch. You must check out from a branch." });
      }
    } else {
      if (!companyBranchId) {
        return res.status(400).json({ error: "Company branch is required for office checkout" });
      }
    }

    const now = new Date();
    const durationHours = existingAttendance.checkIn ? (now.getTime() - existingAttendance.checkIn.getTime()) / (1000 * 60 * 60) : 0;

    const updated = await prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        checkOut: now,
        duration: durationHours
      }
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to checkout' });
  }
}

export const getAttendanceStats = async (req: any, res: any) => {
  try {
    const { employeeId, month, year } = req.query;

    const startOfMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endOfMonth = new Date(parseInt(year as string), parseInt(month as string), 0);

    const where: any = {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };
    if (employeeId) where.employeeId = employeeId;

    const attendanceRecords = await prisma.attendance.findMany({
      where,
    });

    const stats = {
      present: attendanceRecords.filter((r: any) => !!r.checkIn && !r.isHalfDay && !r.isLate).length,
      late: attendanceRecords.filter((r: any) => r.isLate).length,
      halfDay: attendanceRecords.filter((r: any) => r.isHalfDay).length,
      total: attendanceRecords.length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
};
