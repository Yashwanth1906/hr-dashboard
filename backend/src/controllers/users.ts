import { prisma } from '../lib/prisma';

export const getCurrentUser = async (req: any, res: any) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

export const getAllUsers = async (req: any, res: any) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUser = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email } = req.body;

        // Users can only update their own profile unless they're admin
        if (req.user!.userId !== id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { firstName, lastName, email },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};
