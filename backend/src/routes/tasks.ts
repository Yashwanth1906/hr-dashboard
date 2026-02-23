import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllUnapprovedTasks,
  approveTask,
  assignTask,
  getAssignedTasks
} from '../controllers/tasks';

const router = Router();

// Get all tasks with filters
router.get('/', authenticate, getAllTasks);

// Get unapproved tasks
router.get('/unapproved', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), getAllUnapprovedTasks);

// Get assigned tasks (moved before /:id to prevent matching issues)
router.get('/assigned', authenticate, getAssignedTasks);

// Get task by ID
router.get('/:id', authenticate, getTaskById);

// Create task
router.post('/', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']), createTask);

// Update task
router.put('/:id', authenticate, updateTask);

// Approve task
router.put('/:id/approve', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), approveTask);

// Assign task
router.put('/:id/assign', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), assignTask);

// Delete task
router.delete('/:id', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), deleteTask);

export default router;