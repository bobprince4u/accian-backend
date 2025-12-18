import { Router } from "express";
import * as serviceController from "../controllers/serviceController";

const router: Router = Router();

/**
 * @route   GET /api/services
 * @desc    Get all published services
 * @access  Public
 */
router.get("/", serviceController.getAllServices);

/**
 * @route   GET /api/services/:slug
 * @desc    Get single service by slug
 * @access  Public
 */
router.get("/:slug", serviceController.getServiceBySlug);

export default router;
