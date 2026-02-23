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

export const getAttendanceById = async (req: any, res: any) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance record' });
  }
};

export const createAttendance = async (req: any, res: any) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to create attendance record' });
  }
};

export const updateAttendance = async (req: any, res: any) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update attendance record' });
  }
};

export const deleteAttendance = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.attendance.delete({
      where: { id },
    });
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
};

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
      present: attendanceRecords.filter((r: any) => r.status === 'PRESENT').length,
      absent: attendanceRecords.filter((r: any) => r.status === 'ABSENT').length,
      late: attendanceRecords.filter((r: any) => r.status === 'LATE').length,
      halfDay: attendanceRecords.filter((r: any) => r.status === 'HALF_DAY').length,
      onLeave: attendanceRecords.filter((r: any) => r.status === 'ON_LEAVE').length,
      total: attendanceRecords.length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
};
