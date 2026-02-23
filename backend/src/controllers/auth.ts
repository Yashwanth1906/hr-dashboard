import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

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
