import { prisma } from '../lib/prisma';

export const getAllLeaves = async (req: any, res: any) => {
    try {
        const { status, type } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (type) where.type = type;

        const leaves = await prisma.leave.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(leaves);
    } catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
};

export const getMyLeaves = async (req: any, res: any) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const leaves = await prisma.leave.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: 'desc' },
        });

        res.json(leaves);
    } catch (error) {
        console.error('Get my leaves error:', error);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
};

export const getLeaveById = async (req: any, res: any) => {
    try {
        const id = req.params.id as string;

        const leave = await prisma.leave.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        userId: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        // Check if user has permission to view this leave
        const employee = await prisma.employee.findUnique({
            where: { userId: req.user!.userId },
        });

        if (leave.employeeId !== employee?.id && !['HR', 'ADMIN'].includes(req.user!.role)) {
            return res.status(403).json({ error: 'Not authorized to view this leave request' });
        }

        res.json(leave);
    } catch (error) {
        console.error('Get leave error:', error);
        res.status(500).json({ error: 'Failed to fetch leave request' });
    }
};

export const createLeave = async (req: any, res: any) => {
    try {
        const { type, startDate, endDate, reason } = req.body;

        const employee = await prisma.employee.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const leave = await prisma.leave.create({
            data: {
                employeeId: employee.id,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING',
            },
        });

        // Create notification for HR
        try {
            const hrUsers = await prisma.user.findMany({
                where: { role: 'HR' },
            });

            // Avoid creating notifications if we don't have the model
            if ((prisma as any).notification) {
                await (prisma as any).notification.createMany({
                    data: hrUsers.map((hr: any) => ({
                        userId: hr.id,
                        type: 'ANNOUNCEMENT',
                        title: 'New Leave Request',
                        message: `${req.user!.email} has requested ${type} leave`,
                    })),
                });
            }
        } catch (e) {
            console.warn('Could not create notifications');
        }

        res.status(201).json(leave);
    } catch (error) {
        console.error('Create leave error:', error);
        res.status(500).json({ error: 'Failed to create leave request' });
    }
};

export const updateLeaveStatus = async (req: any, res: any) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        // We need an employee to map as approver
        const approverEmployee = await prisma.employee.findUnique({
            where: { userId: req.user!.userId }
        });

        const leave = await prisma.leave.update({
            where: { id },
            data: {
                status,
                approvedById: approverEmployee ? approverEmployee.id : null,
                approvedAt: new Date(),
            },
        });

        // Get employee info for notification
        const employee = await prisma.employee.findUnique({
            where: { id: leave.employeeId },
        });

        // Notify employee
        try {
            if (employee && (prisma as any).notification) {
                await (prisma as any).notification.create({
                    data: {
                        userId: employee.userId,
                        type: 'ANNOUNCEMENT',
                        title: `Leave Request ${status}`,
                        message: `Your ${leave.type} leave request has been ${status.toLowerCase()}`,
                    },
                });
            }
        } catch (e) {
            console.warn('Could not create notification');
        }

        res.json(leave);
    } catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({ error: 'Failed to update leave request' });
    }
};

export const deleteLeave = async (req: any, res: any) => {
    try {
        const id = req.params.id as string;

        const leave = await prisma.leave.findUnique({
            where: { id },
        });

        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        const employee = await prisma.employee.findUnique({
            where: { userId: req.user!.userId },
        });

        if (leave.employeeId !== employee?.id) {
            return res.status(403).json({ error: 'Not authorized to delete this leave request' });
        }

        if (leave.status !== 'PENDING') {
            return res.status(400).json({ error: 'Cannot delete approved or rejected leave requests' });
        }

        await prisma.leave.delete({
            where: { id },
        });

        res.json({ message: 'Leave request deleted successfully' });
    } catch (error) {
        console.error('Delete leave error:', error);
        res.status(500).json({ error: 'Failed to delete leave request' });
    }
};
