"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contactControllers_1 = require("../controllers/contactControllers");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 */
const router = express_1.default.Router();
router.post("/", rateLimiter_1.contactForm, validation_1.contactFormValidationRules, contactControllers_1.submitContactForm);
exports.default = router;
