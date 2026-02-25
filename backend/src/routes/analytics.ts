import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getDashboardAnalytics,
  getEmployeeAnalytics,
  getTaskAnalytics,
  getAttendanceAnalytics,
  getLeaveAnalytics
} from '../controllers/analytics';

const router = Router();

// Get dashboard analytics
router.get('/dashboard', authenticate, getDashboardAnalytics);

// Get employee analytics
router.get('/employees', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), getEmployeeAnalytics);

// Get task analytics
router.get('/tasks', authenticate, getTaskAnalytics);

// Get attendance analytics
router.get('/attendance', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), getAttendanceAnalytics);

// Get leave analytics
router.get('/leaves', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), getLeaveAnalytics);

export default router;