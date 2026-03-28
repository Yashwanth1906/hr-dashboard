import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeeDetails
} from '../controllers/employees';

const router = Router();

// Get all employees
router.get('/', authenticate, getAllEmployees);

// Get detailed employee info (must be before /:id to avoid route conflict)
router.get('/getDetails/:id', authenticate, getEmployeeeDetails);

// Get employee by ID
router.get('/:id', authenticate, getEmployeeById);

// Create employee (admin/HR only, or self for onboarding)
router.post('/', authenticate, authorize(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']), createEmployee);

// Update employee
router.put('/:id', authenticate, authorize(['ADMIN', 'HR']), updateEmployee);

// Delete employee (admin only)
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteEmployee);

export default router;