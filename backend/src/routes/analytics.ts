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

router.get('/dashboard', authenticate, getDashboardAnalytics);

router.get('/employees', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), getEmployeeAnalytics);

router.get('/tasks', authenticate, getTaskAnalytics);

router.get('/attendance', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), getAttendanceAnalytics);

router.get('/leaves', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), getLeaveAnalytics);

export default router;