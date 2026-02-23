import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from '../controllers/department';

const router = Router();

// Get all departments
router.get('/', authenticate, getAllDepartments);

// Get department by ID
router.get('/:id', authenticate, getDepartmentById);

// Create department
router.post('/', authenticate, authorize(['ADMIN', 'HR']), createDepartment);

// Update department
router.put('/:id', authenticate, authorize(['ADMIN', 'HR']), updateDepartment);

// Delete department
router.delete('/:id', authenticate, authorize(['ADMIN', 'HR']), deleteDepartment);

export default router;