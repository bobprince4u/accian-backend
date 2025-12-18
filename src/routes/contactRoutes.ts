import express, { Router } from "express";
import { submitContactForm } from "../controllers/contactControllers";
import { contactFormValidationRules } from "../middleware/validation";
import { contactForm } from "../middleware/rateLimiter";

/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 */

const router: Router = express.Router();

router.post("/", contactForm, contactFormValidationRules, submitContactForm);

export default router;
