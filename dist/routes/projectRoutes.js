"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const router = express_1.default.Router();
/**
 * @route   GET /api/projects
 * @desc    Get all published projects
 * @access  Public
 */
router.get("/", projectController_1.getAllProjects);
/**
 * @route   GET /api/projects/:slug
 * @desc    Get single project by slug
 * @access  Public
 */
router.get("/:slug", projectController_1.getProjectBySlug);
exports.default = router;
