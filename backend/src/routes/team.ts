import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
} from '../controllers/team';

const router = Router();

// Get all teams
router.get('/', authenticate, getAllTeams);

// Get team by ID
router.get('/:id', authenticate, getTeamById);

// Create team
router.post('/', authenticate, authorize(['ADMIN', 'HR']), createTeam);

// Update team
router.put('/:id', authenticate, authorize(['ADMIN', 'HR']), updateTeam);

// Delete team
router.delete('/:id', authenticate, authorize(['ADMIN', 'HR']), deleteTeam);

export default router;