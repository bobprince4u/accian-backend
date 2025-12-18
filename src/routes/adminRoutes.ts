import express, { Router } from "express";
import {
  login,
  getContactById,
  updateContactStatus,
  deleteContact,
  getDashboardStats,
  createProject,
  updateProject,
  deleteProject,
  getTestimonials,
  getContacts,
  getProjects,
} from "../controllers/adminController";
import {
  deleteService,
  updateService,
  createService,
} from "../controllers/serviceController";

import { authenticateToken } from "../middleware/auth";
import { validateLogin } from "../middleware/validation";
import * as rateLimiter from "../middleware/rateLimiter";
import * as adminController from "../controllers/adminController";
import * as serviceController from "../controllers/serviceController";
import * as testimonialController from "../controllers/testimonialController";

const router: Router = express.Router();

/**
 * * @route   POST /api/admin/create
 * @desc    Create new admin account
 * @access  Public (or protected via secret key for safety)
 */
router.post("/create", rateLimiter.adminSignup, adminController.createAdmin);

/**
 * * @route   POST /api/admin/login
 * * @desc    Admin login
 * * @access  Public
 */
router.post("/login", rateLimiter.adminLogin, validateLogin, login);

// Protected routes (require authentication)
router.use(authenticateToken);

/**
 * @route   GET /api/admin/contacts
 * @desc    Get all contact submissions
 * @access  Private (Admin)
 */
router.get("/contacts", getContacts);

/**
 * @route   GET /api/admin/contacts/:id
 * @desc    Get contact by ID
 * @access  Private (Admin)
 */
router.get("/contacts/:id", getContactById);

/**
 * @route   PATCH /api/admin/contacts/:id
 * @desc    Update contact status
 * @access  Private (Admin)
 */
router.patch("/contacts/:id", updateContactStatus);

/**
 * @route   DELETE /api/admin/contacts/:id
 * @desc    Delete contact
 * @access  Private (Admin)
 */
router.delete("/contacts/:id", deleteContact);

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get("/dashboard/stats", getDashboardStats);

/**
 * @route   POST /api/admin/projects
 * @desc    Create new project
 * @access  Private (Admin)
 */

router.post("/projects", createProject);

/**
 * @route   GET /api/admin/projects
 * @desc    Get all projects
 * @access  Private (Admin)
 */
router.get("/projects", getProjects);

/**
 * @route   PUT /api/admin/projects/:id
 * @desc    Update project
 * @access  Private (Admin)
 */
router.put("/projects/:id", updateProject);

/**
 * @route   DELETE /api/admin/projects/:id
 * @desc    Delete (unpublish) project
 * @access  Private (Admin)
 */
router.delete("/projects/:id", deleteProject);

/**
 * @route   GET /api/admin/services
 * @desc    Get all services
 * @access  Private (Admin)
 */
router.get("/services", adminController.getServices);

/**
 * @route   POST /api/admin/services
 * @desc    Create new service
 * @access  Private (Admin)
 */
router.post("/services", createService);

/**
 * @route   PUT /api/admin/services/:id
 * @desc    Update service
 * @access  Private (Admin)
 */
router.put("/services/:id", updateService);

/**
 * @route   DELETE /api/admin/services/:id
 * @desc    Delete (unpublish) service
 * @access  Private (Admin)
 */
router.delete("/services/:id", deleteService);

/**
 * @route   GET /api/admin/testimonials
 * @desc    Get all testimonials
 * @access  Private (Admin)
 */
router.get("/testimonials", getTestimonials);

/**
 * @route   POST /api/admin/testimonials
 * @desc    Create new testimonial
 * @access  Private (Admin)
 */
router.post("/testimonials", testimonialController.createTestimonial);

/**
 * @route   PUT /api/admin/testimonials/:id
 * @desc    Update testimonial
 * @access  Private (Admin)
 */
router.put("/testimonials/:id", testimonialController.updateTestimonial);

/**
 * @route   DELETE /api/admin/testimonials/:id
 * @desc    Delete (unpublish) testimonial
 * @access  Private (Admin)
 */
router.delete("/testimonials/:id", testimonialController.deleteTestimonial);

export default router;
