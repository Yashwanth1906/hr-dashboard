import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
const router = Router();
// Get all employees
router.get('/', authenticate, async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
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
            },
        });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});
// Get employee by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});
// Create employee (admin/HR only)
router.post('/', authenticate, authorize(['ADMIN', 'HR']), async (req, res) => {
    try {
        const { userId, employeeId, departmentId, managerId, position, joinDate, phone, address, emergencyContact, employmentType, status, } = req.body;
        const employee = await prisma.employee.create({
            data: {
                userId,
                employeeId,
                departmentId,
                managerId,
                position,
                joinDate: new Date(joinDate),
                phone,
                address,
                emergencyContact,
                employmentType,
                status: status || 'ACTIVE',
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
        res.status(201).json(employee);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create employee' });
    }
});
// Update employee
router.put('/:id', authenticate, authorize(['ADMIN', 'HR']), async (req, res) => {
    try {
        const { id } = req.params;
        const { departmentId, managerId, position, phone, address, emergencyContact, employmentType, status, } = req.body;
        const employee = await prisma.employee.update({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update employee' });
    }
});
// Delete employee (admin only)
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.employee.delete({
            where: { id },
        });
        res.json({ message: 'Employee deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});
export default router;
//# sourceMappingURL=employees.js.map