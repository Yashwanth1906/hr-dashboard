import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
} from '../controllers/jobs';

const router = Router();

// Get all jobs
router.get('/', authenticate, getAllJobs);

// Get job by ID
router.get('/:id', authenticate, getJobById);

// Create job
router.post('/', authenticate, authorize(['ADMIN', 'HR']), createJob);

// Update job
router.put('/:id', authenticate, authorize(['ADMIN', 'HR']), updateJob);

// Delete job
router.delete('/:id', authenticate, authorize(['ADMIN', 'HR']), deleteJob);

export default router;