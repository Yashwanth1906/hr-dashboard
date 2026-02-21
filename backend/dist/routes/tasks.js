import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';
const router = Router();
// Get all tasks with filters
router.get('/', authenticate, async (req, res) => {
    try {
        const { status, priority, assigneeId, search, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (assigneeId)
            where.assigneeId = assigneeId;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        // If employee, only show their tasks or unassigned tasks
        if (req.user?.role === 'EMPLOYEE') {
            const employee = await prisma.employee.findUnique({
                where: { userId: req.user.id }
            });
            if (employee) {
                where.OR = [
                    { assigneeId: employee.id },
                    { assigneeId: null }
                ];
            }
        }
        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: {
                    assignee: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true, avatar: true }
                            }
                        }
                    }
                },
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limitNum
            }),
            prisma.task.count({ where })
        ]);
        res.json({
            tasks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Failed to fetch tasks' });
    }
});
// Get task by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignee: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Failed to fetch task' });
    }
});
// Create task
router.post('/', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), async (req, res) => {
    try {
        const { title, description, priority, assigneeId, dueDate } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                assigneeId: assigneeId || null,
                createdBy: req.user.id,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'TODO'
            },
            include: {
                assignee: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });
        // Create notification for assignee
        if (assigneeId) {
            const assignee = await prisma.employee.findUnique({
                where: { id: assigneeId },
                include: { user: true }
            });
            if (assignee) {
                await prisma.notification.create({
                    data: {
                        userId: assignee.userId,
                        title: 'New Task Assigned',
                        message: `You have been assigned a new task: ${title}`,
                        type: 'TASK'
                    }
                });
            }
        }
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Failed to create task' });
    }
});
// Update task
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, assigneeId, dueDate } = req.body;
        const existingTask = await prisma.task.findUnique({
            where: { id },
            include: { assignee: true }
        });
        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        // Check permissions
        const isAdmin = ['ADMIN', 'HR', 'MANAGER'].includes(req.user.role);
        const isAssignee = existingTask.assignee?.userId === req.user.id;
        if (!isAdmin && !isAssignee) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }
        // Employees can only update status
        const updateData = {};
        if (isAdmin) {
            if (title !== undefined)
                updateData.title = title;
            if (description !== undefined)
                updateData.description = description;
            if (priority !== undefined)
                updateData.priority = priority;
            if (assigneeId !== undefined)
                updateData.assigneeId = assigneeId || null;
            if (dueDate !== undefined)
                updateData.dueDate = dueDate ? new Date(dueDate) : null;
        }
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'COMPLETED') {
                updateData.completedAt = new Date();
            }
            else {
                updateData.completedAt = null;
            }
        }
        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                assignee: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });
        // Notify assignee of changes
        if (assigneeId && assigneeId !== existingTask.assigneeId) {
            const assignee = await prisma.employee.findUnique({
                where: { id: assigneeId },
                include: { user: true }
            });
            if (assignee) {
                await prisma.notification.create({
                    data: {
                        userId: assignee.userId,
                        title: 'Task Assigned to You',
                        message: `You have been assigned to task: ${task.title}`,
                        type: 'TASK'
                    }
                });
            }
        }
        res.json(task);
    }
    catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Failed to update task' });
    }
});
// Delete task
router.delete('/:id', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), async (req, res) => {
    try {
        const { id } = req.params;
        const existingTask = await prisma.task.findUnique({
            where: { id }
        });
        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        await prisma.task.delete({
            where: { id }
        });
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Failed to delete task' });
    }
});
// Get my tasks (for current employee)
router.get('/my/tasks', authenticate, async (req, res) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId: req.user.id }
        });
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }
        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { assigneeId: employee.id },
                    { assigneeId: null }
                ]
            },
            include: {
                assignee: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' }
            ]
        });
        res.json(tasks);
    }
    catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({ message: 'Failed to fetch tasks' });
    }
});
export default router;
//# sourceMappingURL=tasks.js.map