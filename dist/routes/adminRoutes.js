"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const serviceController_1 = require("../controllers/serviceController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const rateLimiter = __importStar(require("../middleware/rateLimiter"));
const adminController = __importStar(require("../controllers/adminController"));
const testimonialController = __importStar(require("../controllers/testimonialController"));
const audit_1 = require("../middleware/audit");
const router = express_1.default.Router();
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
router.post("/login", rateLimiter.adminLogin, validation_1.validateLogin, adminController_1.login);
// Protected routes (require authentication)
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
/**
 * @route   GET /api/admin/contacts
 * @desc    Get all contact submissions
 * @access  Private (Admin)
 */
router.get("/contacts", adminController_1.getContacts);
/**
 * @route   GET /api/admin/contacts/:id
 * @desc    Get contact by ID
 * @access  Private (Admin)
 */
router.get("/contacts/:id", adminController_1.getContactById);
/**
 * @route   PATCH /api/admin/contacts/:id
 * @desc    Update contact status
 * @access  Private (Admin)
 */
router.patch("/contacts/:id", adminController_1.updateContactStatus);
/**
 * @route   DELETE /api/admin/contacts/:id
 * @desc    Delete contact
 * @access  Private (Admin)
 */
router.delete("/contacts/:id", adminController_1.deleteContact);
/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get("/dashboard/stats", adminController_1.getDashboardStats);
/**
 * @route   POST /api/admin/projects
 * @desc    Create new project
 * @access  Private (Admin)
 */
router.post("/projects", (0, audit_1.auditLog)("Created a new project"), adminController_1.createProject);
/**
 * @route   GET /api/admin/projects
 * @desc    Get all projects
 * @access  Private (Admin)
 */
router.get("/projects", adminController_1.getProjects);
/**
 * @route   PUT /api/admin/projects/:id
 * @desc    Update project
 * @access  Private (Admin)
 */
router.put("/projects/:id", (0, audit_1.auditLog)("Updated a project"), adminController_1.updateProject);
/**
 * @route   DELETE /api/admin/projects/:id
 * @desc    Delete (unpublish) project
 * @access  Private (Admin)
 */
router.delete("/projects/:id", (0, audit_1.auditLog)("Deleted a project"), adminController_1.deleteProject);
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
router.post("/services", (0, audit_1.auditLog)("Created a new service"), serviceController_1.createService);
/**
 * @route   PUT /api/admin/services/:id
 * @desc    Update service
 * @access  Private (Admin)
 */
router.put("/services/:id", (0, audit_1.auditLog)("Updated a service"), serviceController_1.updateService);
/**
 * @route   DELETE /api/admin/services/:id
 * @desc    Delete (unpublish) service
 * @access  Private (Admin)
 */
router.delete("/services/:id", (0, audit_1.auditLog)("Deleted a service"), serviceController_1.deleteService);
/**
 * @route   GET /api/admin/testimonials
 * @desc    Get all testimonials
 * @access  Private (Admin)
 */
router.get("/testimonials", adminController_1.getTestimonials);
/**
 * @route   POST /api/admin/testimonials
 * @desc    Create new testimonial
 * @access  Private (Admin)
 */
router.post("/testimonials", (0, audit_1.auditLog)("Created a new testimonial"), testimonialController.createTestimonial);
/**
 * @route   PUT /api/admin/testimonials/:id
 * @desc    Update testimonial
 * @access  Private (Admin)
 */
router.put("/testimonials/:id", (0, audit_1.auditLog)("Updated a testimonial"), testimonialController.updateTestimonial);
/**
 * @route   DELETE /api/admin/testimonials/:id
 * @desc    Delete (unpublish) testimonial
 * @access  Private (Admin)
 */
router.delete("/testimonials/:id", (0, audit_1.auditLog)("Deleted a testimonial"), testimonialController.deleteTestimonial);
exports.default = router;
