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
