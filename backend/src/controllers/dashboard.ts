import { Request, Response } from "express";
import { prisma } from "../lib/prisma"

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const totalEmployees = await prisma.employee.count();
        const totalTeams = await prisma.team.count();

        const totalPresentToday = await prisma.attendance.count({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        const activeTasks = await prisma.task.count({
            where: {
                status: {
                    notIn: ["COMPLETED", "CANCELLED"]
                }
            }
        });

        const tasksByStateRaw = await prisma.task.groupBy({
            by: ['status'],
            _count: {
                _all: true
            }
        });

        const employeesPerDepartmentRaw = await prisma.department.findMany({
            select: {
                name: true,
                _count: {
                    select: { employees: true }
                }
            }
        });

        const attendanceLast7DaysRaw = await prisma.attendance.groupBy({
            by: ['date'],
            where: {
                date: {
                    gte: sevenDaysAgo,
                    lt: tomorrow
                }
            },
            _count: {
                employeeId: true
            },
            orderBy: {
                date: 'asc'
            }
        });

        const recentTasksRaw = await prisma.task.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                assignee: {
                    include: { user: true }
                },
                team: true
            }
        });

        const tasksByState = tasksByStateRaw.map(t => ({
            state: t.status,
            count: t._count._all
        }));

        const employeesPerDepartment = employeesPerDepartmentRaw.map(d => ({
            department: d.name,
            count: d._count.employees
        }));

        const attendanceLast7DaysMap = new Map(
            attendanceLast7DaysRaw.map(a => [a.date.toISOString().split('T')[0], a._count.employeeId])
        );

        const attendanceTrendData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const present = attendanceLast7DaysMap.get(dateStr) || 0;
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

            attendanceTrendData.push({
                day: dayName,
                date: dateStr,
                present: present,
                absent: totalEmployees - present
            });
        }

        const recentTasks = recentTasksRaw.map(t => ({
            id: t.id,
            title: t.title,
            assigneeName: t.assignee ? `${t.assignee.user.firstName} ${t.assignee.user.lastName}` : "Unassigned",
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : "No Due Date"
        }));

        return res.status(200).json({
            totalEmployees,
            totalPresentToday,
            activeTasks,
            totalTeams,
            tasksByState,
            employeesPerDepartment,
            attendanceTrendData,
            recentTasks
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}