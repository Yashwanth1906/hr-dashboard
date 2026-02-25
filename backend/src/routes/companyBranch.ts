import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getAllCompanyBranches, createCompanyBranch } from "../controllers/companyBranch";

const router = Router();

router.get('/', authenticate, authorize(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']), getAllCompanyBranches);
router.post('/', authenticate, authorize(['ADMIN', 'HR']), createCompanyBranch);

export default router;
