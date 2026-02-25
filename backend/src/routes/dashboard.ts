import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getDashboardData } from "../controllers/dashboard";

const router = Router();

router.get("/", authenticate, authorize(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]), getDashboardData);

export default router;