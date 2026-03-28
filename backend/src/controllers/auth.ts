import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

export const registerUser = async (req: any, res: any) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                isOnBoarded: false
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                role: true,
                lastName: true,
                createdAt: true,
                isOnBoarded: true
            },
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, id: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

export const loginUser = async (req: any, res: any) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, id: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isOnBoarded: (user as any).isOnBoarded,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

// Admin creates a user with a specific role
export const adminCreateUser = async (req: any, res: any) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        if (!email || !password || !firstName || !lastName || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const validRoles: UserRole[] = ['MANAGER', 'HR', 'EMPLOYEE'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be MANAGER, HR, or EMPLOYEE' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role as UserRole,
                isOnBoarded: false,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                isOnBoarded: true,
            },
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('adminCreateUser error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Change own password (authenticated user)
export const changePassword = async (req: any, res: any) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

// Admin resets a user's password
export const resetUserPassword = async (req: any, res: any) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({ error: 'userId and newPassword are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('resetUserPassword error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
