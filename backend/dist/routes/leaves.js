import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
const router = Router();
// Get all leave requests (HR/Admin only)
router.get('/', authenticate, authorize(['HR', 'ADMIN']), async (req, res) => {
    try {
        const { status, type } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const leaves = await prisma.leave.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(leaves);
    }
    catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
});
// Get my leave requests
router.get('/my', authenticate, async (req, res) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId: req.user.userId },
        });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        const leaves = await prisma.leave.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(leaves);
    }
    catch (error) {
        console.error('Get my leaves error:', error);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
});
// Get leave request by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const leave = await prisma.leave.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        userId: true,
                        user: {
                            select: {
                                name: true,
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
            where: { userId: req.user.userId },
        });
        if (leave.employeeId !== employee?.id && !['HR', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to view this leave request' });
        }
        res.json(leave);
    }
    catch (error) {
        console.error('Get leave error:', error);
        res.status(500).json({ error: 'Failed to fetch leave request' });
    }
});
// Create leave request
router.post('/', authenticate, async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;
        const employee = await prisma.employee.findUnique({
            where: { userId: req.user.userId },
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
        const hrUsers = await prisma.user.findMany({
            where: { role: 'HR' },
        });
        await prisma.notification.createMany({
            data: hrUsers.map(hr => ({
                userId: hr.id,
                type: 'ANNOUNCEMENT',
                title: 'New Leave Request',
                message: `${req.user.email} has requested ${type} leave`,
            })),
        });
        res.status(201).json(leave);
    }
    catch (error) {
        console.error('Create leave error:', error);
        res.status(500).json({ error: 'Failed to create leave request' });
    }
});
// Update leave request status (HR/Admin only)
router.patch('/:id/status', authenticate, authorize(['HR', 'ADMIN']), async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const leave = await prisma.leave.update({
            where: { id },
            data: {
                status,
                approvedBy: req.user.userId,
                approvedAt: new Date(),
            },
        });
        // Get employee info for notification
        const employee = await prisma.employee.findUnique({
            where: { id: leave.employeeId },
        });
        // Notify employee
        if (employee) {
            await prisma.notification.create({
                data: {
                    userId: employee.userId,
                    type: 'ANNOUNCEMENT',
                    title: `Leave Request ${status}`,
                    message: `Your ${leave.type} leave request has been ${status.toLowerCase()}`,
                },
            });
        }
        res.json(leave);
    }
    catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({ error: 'Failed to update leave request' });
    }
});
// Delete leave request (only if pending)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const leave = await prisma.leave.findUnique({
            where: { id },
        });
        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found' });
        }
        const employee = await prisma.employee.findUnique({
            where: { userId: req.user.userId },
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
    }
    catch (error) {
        console.error('Delete leave error:', error);
        res.status(500).json({ error: 'Failed to delete leave request' });
    }
});
export default router;
//# sourceMappingURL=leaves.js.map