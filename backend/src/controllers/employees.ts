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
                team: {
                    include: {
                        managers: {
                            include: {
                                user: { select: { id: true, firstName: true, lastName: true } }
                            }
                        }
                    }
                },
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
            include: {
                user: true,
                certifications: true,
                department: true,
                jobRole: true,
                team: true,
            }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const employeeId = employee.id;

        // Fetch tasks
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
        const totalAssignedTasks = tasks.filter((task: any) => task.assigneeId === employeeId).length;
        const overdueTasks = tasks.filter((task: any) =>
            task.assigneeId === employeeId &&
            task.status !== 'COMPLETED' && task.status !== 'CANCELLED' &&
            task.dueDate && new Date(task.dueDate) < new Date()
        ).length;
        const onTimeTasks = completedTasks.filter((task: any) =>
            task.dueDate && task.completedAt && new Date(task.completedAt) <= new Date(task.dueDate)
        ).length;

        // Attendance (last 30 days)
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
        const totalLateDays = attendance.filter((d: any) => d.isLate).length;
        const totalHalfDay = attendance.filter((d: any) => d.isHalfDay).length;
        const presentDays = totalAttendance - (totalLateDays + totalHalfDay);
        const attendanceRate = totalAttendance > 0 ? (presentDays / 30) * 100 : 0;

        // Leaves
        const leaves = await prisma.leave.findMany({
            where: { employeeId: employeeId }
        });
        const approvedLeaves = leaves.filter((l: any) => l.status === 'APPROVED');
        const totalLeaveDays = approvedLeaves.reduce((sum: number, l: any) => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return sum + days;
        }, 0);

        // Targets
        const targets = await prisma.target.findMany({
            where: { employeeId: employeeId },
            include: {
                createdBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        const totalTargets = targets.length;
        const completedTargets = targets.filter((t: any) => t.status === 'COMPLETED' || t.status === 'REVIEWED').length;
        const reviewedTargets = targets.filter((t: any) => t.status === 'REVIEWED');
        const missedTargets = targets.filter((t: any) =>
            t.status === 'ASSIGNED' && t.dueDate && new Date(t.dueDate) < new Date()
        ).length;

        // Certifications count
        const certCount = employee.certifications?.length || 0;

        // Ratings
        const ratings = await prisma.employeeRating.findMany({
            where: { employeeId: employeeId },
            include: {
                ratedBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // ========== KPI CALCULATION ==========
        // KPI = Key Performance Indicator (positive performance metrics)
        // Scale: 0-10
        //
        // Components (weighted):
        // 1. Task Completion Rate (25%) - % of assigned tasks completed
        // 2. Attendance Rate (20%) - % of present days out of 30
        // 3. Target Completion Rate (25%) - % of targets completed/reviewed
        // 4. On-Time Delivery Rate (15%) - % of tasks completed by due date
        // 5. Certifications Score (5%) - capped at 5 certs = max
        // 6. Manager Target Ratings (10%) - avg manager rating on targets

        const taskCompletionRate = totalAssignedTasks > 0
            ? (completedTasks.filter((t: any) => t.assigneeId === employeeId).length / totalAssignedTasks)
            : 0;

        const attendanceScore = Math.min(attendanceRate / 100, 1);

        const targetCompletionRate = totalTargets > 0
            ? (completedTargets / totalTargets)
            : 0;

        const onTimeRate = completedTasks.length > 0
            ? (onTimeTasks / completedTasks.length)
            : 0;

        const certScore = Math.min(certCount / 5, 1);

        const avgManagerTargetRating = reviewedTargets.length > 0
            ? reviewedTargets.reduce((sum: number, t: any) => sum + (t.managerRating || 0), 0) / reviewedTargets.length / 5
            : 0;

        const kpiScore = (
            taskCompletionRate * 0.25 +
            attendanceScore * 0.20 +
            targetCompletionRate * 0.25 +
            onTimeRate * 0.15 +
            certScore * 0.05 +
            avgManagerTargetRating * 0.10
        ) * 10;

        // ========== KRI CALCULATION ==========
        // KRI = Key Risk Indicator (risk/negative metrics)
        // Scale: 0-10 (higher = MORE risk, worse)
        //
        // Components (weighted):
        // 1. Late Attendance Rate (25%) - % of late days
        // 2. Missed Targets (25%) - % of overdue/missed targets
        // 3. Overdue Tasks (20%) - % of overdue tasks
        // 4. Leave Frequency (15%) - leave days relative to 30-day window
        // 5. Incomplete Task Rate (15%) - % of non-completed assigned tasks

        const lateRate = totalAttendance > 0
            ? (totalLateDays / totalAttendance)
            : 0;

        const missedTargetRate = totalTargets > 0
            ? (missedTargets / totalTargets)
            : 0;

        const overdueTaskRate = totalAssignedTasks > 0
            ? (overdueTasks / totalAssignedTasks)
            : 0;

        const leaveFrequency = Math.min(totalLeaveDays / 30, 1);

        const incompleteTaskRate = totalAssignedTasks > 0
            ? (1 - (completedTasks.filter((t: any) => t.assigneeId === employeeId).length / totalAssignedTasks))
            : 0;

        const kriScore = (
            lateRate * 0.25 +
            missedTargetRate * 0.25 +
            overdueTaskRate * 0.20 +
            leaveFrequency * 0.15 +
            incompleteTaskRate * 0.15
        ) * 10;

        // Overall Score = KPI adjusted down by KRI
        const overallScore = Math.max(0, Math.min(10, kpiScore - (kriScore * 0.5)));

        res.json({
            employee,
            kpiScore: Math.round(kpiScore * 10) / 10,
            kriScore: Math.round(kriScore * 10) / 10,
            overallScore: Math.round(overallScore * 10) / 10,
            kpiBreakdown: {
                taskCompletionRate: Math.round(taskCompletionRate * 100),
                attendanceScore: Math.round(attendanceScore * 100),
                targetCompletionRate: Math.round(targetCompletionRate * 100),
                onTimeDeliveryRate: Math.round(onTimeRate * 100),
                certificationsScore: Math.round(certScore * 100),
                managerTargetRating: Math.round(avgManagerTargetRating * 100),
            },
            kriBreakdown: {
                lateAttendanceRate: Math.round(lateRate * 100),
                missedTargetRate: Math.round(missedTargetRate * 100),
                overdueTaskRate: Math.round(overdueTaskRate * 100),
                leaveFrequency: Math.round(leaveFrequency * 100),
                incompleteTaskRate: Math.round(incompleteTaskRate * 100),
            },
            attendanceStats: {
                present: presentDays,
                late: totalLateDays,
                absent: 30 - totalAttendance,
                halfDay: totalHalfDay
            },
            attendanceRate: Math.round(attendanceRate),
            completedTasks: completedTasks,
            recentTasks: tasks.slice(0, 10),
            targets,
            ratings,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}