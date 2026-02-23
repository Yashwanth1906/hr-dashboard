import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notifications';

const router = Router();

// Get my notifications
router.get('/my', authenticate, getMyNotifications);

// Mark all notifications as read
router.put('/read-all', authenticate, markAllNotificationsAsRead);

// Get unread count
router.get('/unread-count', authenticate, getUnreadCount);

// Mark notification as read
router.put('/:id/read', authenticate, markNotificationAsRead);

// Delete notification
router.delete('/:id', authenticate, deleteNotification);

export default router;