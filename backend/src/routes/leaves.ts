import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllLeaves,
  getMyLeaves,
  getLeaveById,
  createLeave,
  updateLeaveStatus,
  deleteLeave,
} from '../controllers/leaves';

const router = Router();

// Get all leave requests (HR/Admin only)
router.get('/', authenticate, authorize(['HR', 'ADMIN']), getAllLeaves);

// Get my leave requests
router.get('/my', authenticate, getMyLeaves);

// Get leave request by ID
router.get('/:id', authenticate, getLeaveById);

// Create leave request
router.post('/', authenticate, createLeave);

// Update leave request status (HR/Admin only)
router.patch('/:id/status', authenticate, authorize(['HR', 'ADMIN']), updateLeaveStatus);

// Delete leave request (only if pending)
router.delete('/:id', authenticate, deleteLeave);

export default router;