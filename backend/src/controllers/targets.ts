import { prisma } from '../lib/prisma';

// Get all targets for an employee
export const getTargetsForEmployee = async (req: any, res: any) => {
    try {
        const { employeeId } = req.params;
        const targets = await prisma.target.findMany({
            where: { employeeId },
            include: {
                employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
                createdBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(targets);
    } catch (error) {
        console.error('getTargetsForEmployee error:', error);
        res.status(500).json({ error: 'Failed to fetch targets' });
    }
};

// Get targets assigned to current user
export const getMyTargets = async (req: any, res: any) => {
    try {
        const userId = req.user.userId;
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const targets = await prisma.target.findMany({
            where: { employeeId: employee.id },
            include: {
                createdBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(targets);
    } catch (error) {
        console.error('getMyTargets error:', error);
        res.status(500).json({ error: 'Failed to fetch targets' });
    }
};

// Get targets created by current user (manager view)
export const getTargetsCreatedByMe = async (req: any, res: any) => {
    try {
        const userId = req.user.userId;
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const targets = await prisma.target.findMany({
            where: { createdById: employee.id },
            include: {
                employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
                createdBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(targets);
    } catch (error) {
        console.error('getTargetsCreatedByMe error:', error);
        res.status(500).json({ error: 'Failed to fetch targets' });
    }
};

// Create a target (manager assigns to employee)
export const createTarget = async (req: any, res: any) => {
    try {
        const userId = req.user.userId;
        const manager = await prisma.employee.findUnique({ where: { userId } });
        if (!manager) return res.status(404).json({ error: 'Manager employee record not found' });

        const { employeeId, title, description, dueDate } = req.body;

        const target = await prisma.target.create({
            data: {
                employeeId,
                createdById: manager.id,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
            include: {
                employee: { include: { user: { select: { firstName: true, lastName: true } } } },
                createdBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            }
        });
        res.status(201).json(target);
    } catch (error) {
        console.error('createTarget error:', error);
        res.status(500).json({ error: 'Failed to create target' });
    }
};

// Employee marks target as completed with evidence and self-rating
export const completeTarget = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { evidenceUrl, selfRating, selfDescription } = req.body;

        const target = await prisma.target.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                evidenceUrl,
                selfRating: parseInt(selfRating),
                selfDescription,
                completedAt: new Date(),
            },
            include: {
                employee: { include: { user: { select: { firstName: true, lastName: true } } } },
                createdBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            }
        });
        res.json(target);
    } catch (error) {
        console.error('completeTarget error:', error);
        res.status(500).json({ error: 'Failed to complete target' });
    }
};

// Manager reviews a completed target
export const reviewTarget = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { managerRating, managerFeedback } = req.body;

        const target = await prisma.target.update({
            where: { id },
            data: {
                status: 'REVIEWED',
                managerRating: parseInt(managerRating),
                managerFeedback,
                reviewedAt: new Date(),
            },
            include: {
                employee: { include: { user: { select: { firstName: true, lastName: true } } } },
                createdBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            }
        });
        res.json(target);
    } catch (error) {
        console.error('reviewTarget error:', error);
        res.status(500).json({ error: 'Failed to review target' });
    }
};

// Delete a target
export const deleteTarget = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        await prisma.target.delete({ where: { id } });
        res.json({ message: 'Target deleted successfully' });
    } catch (error) {
        console.error('deleteTarget error:', error);
        res.status(500).json({ error: 'Failed to delete target' });
    }
};

// Employee submits overall self-rating
export const submitSelfRating = async (req: any, res: any) => {
    try {
        const userId = req.user.userId;
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const { rating, description } = req.body;

        const employeeRating = await prisma.employeeRating.create({
            data: {
                employeeId: employee.id,
                ratedById: employee.id,
                rating: parseInt(rating),
                description,
                type: 'SELF',
            },
            include: {
                employee: { include: { user: { select: { firstName: true, lastName: true } } } },
                ratedBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            }
        });
        res.status(201).json(employeeRating);
    } catch (error) {
        console.error('submitSelfRating error:', error);
        res.status(500).json({ error: 'Failed to submit self rating' });
    }
};

// Manager submits overall rating for an employee
export const submitManagerRating = async (req: any, res: any) => {
    try {
        const userId = req.user.userId;
        const manager = await prisma.employee.findUnique({ where: { userId } });
        if (!manager) return res.status(404).json({ error: 'Manager not found' });

        const { employeeId, rating, description } = req.body;

        const employeeRating = await prisma.employeeRating.create({
            data: {
                employeeId,
                ratedById: manager.id,
                rating: parseInt(rating),
                description,
                type: 'MANAGER',
            },
            include: {
                employee: { include: { user: { select: { firstName: true, lastName: true } } } },
                ratedBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            }
        });
        res.status(201).json(employeeRating);
    } catch (error) {
        console.error('submitManagerRating error:', error);
        res.status(500).json({ error: 'Failed to submit manager rating' });
    }
};

// Get all ratings for an employee
export const getEmployeeRatings = async (req: any, res: any) => {
    try {
        const { employeeId } = req.params;
        const ratings = await prisma.employeeRating.findMany({
            where: { employeeId },
            include: {
                ratedBy: { include: { user: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(ratings);
    } catch (error) {
        console.error('getEmployeeRatings error:', error);
        res.status(500).json({ error: 'Failed to fetch ratings' });
    }
};
