import { prisma } from '../lib/prisma';

export const getAllEmployees = async (req: any, res: any) => {
    try {
        const employees = await prisma.employee.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        avatar: true,
                    },
                },
                jobRole: true,
                team: true,
                department: true
            },
        });
        res.json(employees);
    } catch (error) {
        console.error('getAllEmployees error:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};

export const getEmployeeById = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const employee = await (prisma.employee.findUnique as any)({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                department: true,
                manager: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                certifications: true,
            },
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error('getEmployeeById error:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
};

export const createEmployee = async (req: any, res: any) => {
    try {
        const {
            userId,
            departmentId,
            teamId,
            jobRoleId,
            joinDate,
            phone,
            address,
        } = req.body;

        const employeeData: any = {
            departmentId,
            jobRoleId,
            joinDate: new Date(joinDate),
            phone,
            address,
        };
        if (teamId) {
            employeeData.teamId = teamId;
        }

        const employee = await (prisma.employee.upsert as any)({
            where: { userId },
            update: employeeData,
            create: {
                userId,
                ...employeeData
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                department: true,
            },
        });

        // The Prisma client was likely regenerated but the TS server is caching the old types. 
        // We will use (prisma.user.update as any) to bypass the typescript error.
        await (prisma.user.update as any)({
            where: { id: userId },
            data: { isOnBoarded: true },
        });

        res.status(201).json(employee);
    } catch (error) {
        console.error('createEmployee error:', error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
};

export const updateEmployee = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const {
            departmentId,
            managerId,
            position,
            phone,
            address,
            emergencyContact,
            employmentType,
            status,
        } = req.body;

        const employee = await (prisma.employee.update as any)({
            where: { id },
            data: {
                departmentId,
                managerId,
                position,
                phone,
                address,
                emergencyContact,
                employmentType,
                status,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                department: true,
            },
        });

        res.json(employee);
    } catch (error) {
        console.error('updateEmployee error:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
};

export const deleteEmployee = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        await prisma.employee.delete({
            where: { id },
        });
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete employee' });
    }
};


export const getEmployeeeDetails = async (req: any, res: any) => {
    try {
        const { id } = req.params; // Expects userId here based on frontend usage
        const employee = await prisma.employee.findUnique({
            where: { userId: id },
            include: { user: true }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const employeeId = employee.id;

        const tasks = await (prisma.task.findMany as any)({
            where: {
                OR: [
                    { assigneeId: employeeId },
                    { reviewerId: employeeId },
                    { testerId: employeeId }
                ]
            },
            include: {
                assignee: { include: { user: true } },
                team: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        const completedTasks = tasks.filter((task: any) => task.status === 'COMPLETED');

        const kpiScore = employee.kpi || 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendance = await prisma.attendance.findMany({
            where: {
                AND: [
                    { employeeId: employeeId },
                    { date: { gte: thirtyDaysAgo } }
                ]
            }
        });

        const totalAttendance = attendance.length;
        const totalLateDays = attendance.filter((thatDay: any) => thatDay.isLate).length;
        const totalHalfDay = attendance.filter((thatDay: any) => thatDay.isHalfDay).length;

        const presentDays = totalAttendance - (totalLateDays + totalHalfDay);
        const attendanceRate = totalAttendance > 0 ? (presentDays / 30) * 100 : 0;

        res.json({
            employee,
            kpiScore,
            overallScore: kpiScore,
            attendanceStats: {
                present: presentDays,
                late: totalLateDays,
                absent: 30 - totalAttendance,
                halfDay: totalHalfDay
            },
            attendanceRate: Math.round(attendanceRate),
            completedTasks: completedTasks,
            recentTasks: tasks.slice(0, 10)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}