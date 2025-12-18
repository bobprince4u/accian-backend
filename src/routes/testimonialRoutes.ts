import { Router } from "express";
import {
  getAllTestimonials,
  getTestimonialById,
} from "../controllers/testimonialController";

const router: Router = Router();

/**
 * @route   GET /api/testimonials
 * @desc    Get all published testimonials
 * @access  Public
 */
router.get("/", getAllTestimonials);

/**
 * @route   GET /api/testimonials/:id
 * @desc    Get single testimonial
 * @access  Public
 */
router.get("/:id", getTestimonialById);

export default router;
