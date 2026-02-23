import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getCurrentUser,
  getAllUsers,
  updateUser,
} from '../controllers/users';

const router = Router();

// Get current user
router.get('/me', authenticate, getCurrentUser);

// Get all users (admin only)
router.get('/', authenticate, authorize(['ADMIN', 'HR']), getAllUsers);

// Update user
router.put('/:id', authenticate, updateUser);

export default router;