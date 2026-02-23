import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getAllCertifications,
  getCertificationById,
  createCertification,
  updateCertification,
  deleteCertification,
  getMyCertifications
} from '../controllers/certifications';

const router = Router();

// Get all certifications
router.get('/', authenticate, getAllCertifications);

// Get my certifications
router.get('/my/certifications', authenticate, getMyCertifications);

// Get certification by ID
router.get('/:id', authenticate, getCertificationById);

// Create certification
router.post('/', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), createCertification);

// Update certification
router.put('/:id', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), updateCertification);

// Delete certification
router.delete('/:id', authenticate, requireRole(['ADMIN', 'HR', 'MANAGER']), deleteCertification);

export default router;