import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getTargetsForEmployee,
    getMyTargets,
    getTargetsCreatedByMe,
    createTarget,
    completeTarget,
    reviewTarget,
    deleteTarget,
    submitSelfRating,
    submitManagerRating,
    getEmployeeRatings,
} from '../controllers/targets';

const router = Router();

// Employee: get my targets
router.get('/my', authenticate, getMyTargets);

// Manager: get targets I created
router.get('/created', authenticate, authorize(['ADMIN', 'HR', 'MANAGER']), getTargetsCreatedByMe);

// Get all targets for a specific employee
router.get('/employee/:employeeId', authenticate, getTargetsForEmployee);

// Get ratings for an employee
router.get('/ratings/:employeeId', authenticate, getEmployeeRatings);

// Manager: create target for employee
router.post('/', authenticate, authorize(['ADMIN', 'HR', 'MANAGER']), createTarget);

// Employee: mark target as completed with evidence + self-rating
router.put('/:id/complete', authenticate, completeTarget);

// Manager: review completed target
router.put('/:id/review', authenticate, authorize(['ADMIN', 'HR', 'MANAGER']), reviewTarget);

// Employee: submit overall self-rating
router.post('/ratings/self', authenticate, submitSelfRating);

// Manager: submit overall rating for employee
router.post('/ratings/manager', authenticate, authorize(['ADMIN', 'HR', 'MANAGER']), submitManagerRating);

// Delete target
router.delete('/:id', authenticate, authorize(['ADMIN', 'HR', 'MANAGER']), deleteTarget);

export default router;
