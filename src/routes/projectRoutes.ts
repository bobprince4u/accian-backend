import express, { Router } from "express";
import {
  getAllProjects,
  getProjectBySlug,
} from "../controllers/projectController";

const router: Router = express.Router();

/**
 * @route   GET /api/projects
 * @desc    Get all published projects
 * @access  Public
 */
router.get("/", getAllProjects);

/**
 * @route   GET /api/projects/:slug
 * @desc    Get single project by slug
 * @access  Public
 */
router.get("/:slug", getProjectBySlug);

export default router;
