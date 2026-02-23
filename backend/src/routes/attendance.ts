import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
} from '../controllers/attendance';

const router = Router();

// Get all attendance records
router.get('/', authenticate, getAllAttendance);

// Get attendance statistics
router.get('/stats/summary', authenticate, getAttendanceStats);

// Get attendance by ID
router.get('/:id', authenticate, getAttendanceById);

// Create attendance record
router.post('/', authenticate, authorize(['ADMIN', 'HR']), createAttendance);

// Update attendance record
router.put('/:id', authenticate, authorize(['ADMIN', 'HR']), updateAttendance);

// Delete attendance record
router.delete('/:id', authenticate, authorize(['ADMIN', 'HR']), deleteAttendance);

export default router;