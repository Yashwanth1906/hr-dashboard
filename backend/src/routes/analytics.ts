import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// Get dashboard analytics
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get counts
    const [
      totalEmployees,
      activeEmployees,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      todayAttendance,
      pendingLeaves,
      upcomingCertifications
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.attendance.count({
        where: {
          date: startOfDay,
          status: { in: ['PRESENT', 'LATE'] }
        }
      }),
      prisma.leave.count({ where: { status: 'PENDING' } }),
      prisma.certification.count({
        where: {
          expiryDate: {
            gte: now,
            lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
          }
        }
      })
    ]);

    // Get recent activities
    const recentActivities = await prisma.task.findMany({
      where: {
        updatedAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      },
      include: {
        assignee: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Get department distribution
    const departmentStats = await prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true }
    });

    // Get task status distribution
    const taskStatusStats = await prisma.task.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    res.json({
      counts: {
        totalEmployees,
        activeEmployees,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        todayAttendance,
        pendingLeaves,
        upcomingCertifications
      },
      recentActivities: recentActivities.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        assignee: task.assignee?.user.name,
        updatedAt: task.updatedAt
      })),
      departmentDistribution: departmentStats.map(d => ({
        department: d.department,
        count: d._count.id
      })),
      taskStatusDistribution: taskStatusStats.map(s => ({
        status: s.status,
        count: s._count.id
      }))
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
  }
});

// Get employee analytics
router.get('/employees', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), async (req, res) => {
  try {
    const { department, startDate, endDate } = req.query;

    const where: any = {};
    if (department) where.department = department as string;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            tasks: true,
            attendances: true,
            leaves: true
          }
        }
      }
    });

    // Calculate statistics
    const stats = {
      totalEmployees: employees.length,
      byDepartment: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      averageTasksPerEmployee: 0,
      attendanceRate: 0
    };

    let totalTasks = 0;
    let totalAttendance = 0;
    let presentAttendance = 0;

    employees.forEach(emp => {
      // Department stats
      stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1;

      // Status stats
      stats.byStatus[emp.status] = (stats.byStatus[emp.status] || 0) + 1;

      // Task count
      totalTasks += emp._count.tasks;
    });

    // Get attendance stats
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      _count: { id: true },
      where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined
    });

    attendanceStats.forEach(stat => {
      totalAttendance += stat._count.id;
      if (stat.status === 'PRESENT' || stat.status === 'LATE') {
        presentAttendance += stat._count.id;
      }
    });

    stats.averageTasksPerEmployee = employees.length > 0 ? totalTasks / employees.length : 0;
    stats.attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

    res.json({
      employees: employees.map(e => ({
        id: e.id,
        name: e.user.name,
        email: e.user.email,
        department: e.department,
        status: e.status,
        taskCount: e._count.tasks,
        attendanceCount: e._count.attendances,
        leaveCount: e._count.leaves
      })),
      statistics: stats
    });
  } catch (error) {
    console.error('Employee analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch employee analytics' });
  }
});

// Get task analytics
router.get('/tasks', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, assigneeId } = req.query;

    const where: any = {};
    if (assigneeId) where.assigneeId = assigneeId as string;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);
    if (Object.keys(dateFilter).length > 0) {
      where.dueDate = dateFilter;
    }

    const [tasks, stats] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            include: {
              user: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.task.groupBy({
        by: ['status', 'priority'],
        _count: { id: true },
        where
      })
    ]);

    // Calculate completion rate and overdue tasks
    const now = new Date();
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'COMPLETED');

    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    // Group stats by status and priority
    const statusStats: Record<string, number> = {};
    const priorityStats: Record<string, number> = {};

    stats.forEach(stat => {
      statusStats[stat.status] = (statusStats[stat.status] || 0) + stat._count.id;
      priorityStats[stat.priority] = (priorityStats[stat.priority] || 0) + stat._count.id;
    });

    res.json({
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee?.user.name,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
        isOverdue: t.dueDate && t.dueDate < now && t.status !== 'COMPLETED'
      })),
      statistics: {
        total: tasks.length,
        completionRate,
        overdueCount: overdueTasks.length,
        byStatus: statusStats,
        byPriority: priorityStats
      }
    });
  } catch (error) {
    console.error('Task analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch task analytics' });
  }
});

// Get attendance analytics
router.get('/attendance', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      date: {
        gte: start,
        lte: end
      }
    };
    if (employeeId) where.employeeId = employeeId as string;

    const [attendanceRecords, stats] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            include: {
              user: { select: { name: true } }
            }
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        _count: { id: true },
        where
      })
    ]);

    // Calculate statistics
    const totalRecords = attendanceRecords.length;
    const statusCounts: Record<string, number> = {};

    stats.forEach(stat => {
      statusCounts[stat.status] = stat._count.id;
    });

    const presentCount = statusCounts['PRESENT'] || 0;
    const lateCount = statusCounts['LATE'] || 0;
    const absentCount = statusCounts['ABSENT'] || 0;

    const attendanceRate = totalRecords > 0
      ? ((presentCount + lateCount) / totalRecords) * 100
      : 0;

    // Get daily breakdown
    const dailyStats: Record<string, { present: number; absent: number; late: number }> = {};

    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { present: 0, absent: 0, late: 0 };
      }
      dailyStats[dateKey][record.status.toLowerCase() as 'present' | 'absent' | 'late']++;
    });

    res.json({
      attendance: attendanceRecords.map(a => ({
        id: a.id,
        employeeName: a.employee.user.name,
        date: a.date,
        status: a.status,
        checkIn: a.checkIn,
        checkOut: a.checkOut
      })),
      statistics: {
        totalRecords,
        attendanceRate,
        statusCounts: {
          present: presentCount,
          late: lateCount,
          absent: absentCount
        },
        dailyBreakdown: dailyStats
      }
    });
  } catch (error) {
    console.error('Attendance analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance analytics' });
  }
});

// Get leave analytics
router.get('/leaves', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const [leaves, stats] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: {
          employee: {
            include: {
              user: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leave.groupBy({
        by: ['status', 'type'],
        _count: { id: true },
        where
      })
    ]);

    // Calculate statistics
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    stats.forEach(stat => {
      statusCounts[stat.status] = (statusCounts[stat.status] || 0) + stat._count.id;
      typeCounts[stat.type] = (typeCounts[stat.type] || 0) + stat._count.id;
    });

    // Calculate total leave days
    let totalLeaveDays = 0;
    leaves.forEach(leave => {
      const days = Math.ceil(
        (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      totalLeaveDays += days;
    });

    res.json({
      leaves: leaves.map(l => ({
        id: l.id,
        employeeName: l.employee.user.name,
        type: l.type,
        status: l.status,
        startDate: l.startDate,
        endDate: l.endDate,
        duration: Math.ceil(
          (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      })),
      statistics: {
        totalRequests: leaves.length,
        totalLeaveDays,
        byStatus: statusCounts,
        byType: typeCounts
      }
    });
  } catch (error) {
    console.error('Leave analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch leave analytics' });
  }
});

export default router;