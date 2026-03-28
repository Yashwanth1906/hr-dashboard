import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  registerUser,
  loginUser,
  adminCreateUser,
  changePassword,
  resetUserPassword,
} from '../controllers/auth';

const router = Router();

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Admin creates a user with role
router.post('/create-user', authenticate, authorize(['ADMIN']), adminCreateUser);

// Authenticated user changes own password
router.put('/change-password', authenticate, changePassword);

// Admin resets any user's password
router.put('/reset-password', authenticate, authorize(['ADMIN']), resetUserPassword);

export default router;
