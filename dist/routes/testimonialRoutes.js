"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testimonialController_1 = require("../controllers/testimonialController");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/testimonials
 * @desc    Get all published testimonials
 * @access  Public
 */
router.get("/", testimonialController_1.getAllTestimonials);
/**
 * @route   GET /api/testimonials/:id
 * @desc    Get single testimonial
 * @access  Public
 */
router.get("/:id", testimonialController_1.getTestimonialById);
exports.default = router;
