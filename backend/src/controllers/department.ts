import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAllDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany();
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getDepartmentById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        if (!id) {
            return res.status(400).json({ message: 'Department ID is required' });
        }
        const department = await prisma.department.findUnique({
            where: { id },
        });
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json(department);
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const department = await prisma.department.create({
            data: { name },
        });
        res.json(department);
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Department ID is required' });
        }
        const department = await prisma.department.update({
            where: { id },
            data: { name },
        });
        res.json(department);
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        if (!id) {
            return res.status(400).json({ message: 'Department ID is required' });
        }
        await prisma.department.delete({
            where: { id },
        });
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};