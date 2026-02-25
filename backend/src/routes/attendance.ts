import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllAttendance,
  markAttendance,
  checkOut,
  getAttendanceStats,
} from '../controllers/attendance';

const router = Router();

// Get all attendance records
router.get('/', authenticate, getAllAttendance);

// Get attendance statistics
router.get('/stats/summary', authenticate, getAttendanceStats);

// Create attendance record
router.post('/mark', authenticate, authorize(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']), markAttendance);

// Check out
router.put('/checkout', authenticate, authorize(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']), checkOut);

export default router;