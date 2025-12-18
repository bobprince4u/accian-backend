import { body, ValidationChain } from "express-validator";

//Contact form validation rules
export const contactFormValidationRules: ValidationChain[] = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 4, max: 100 })
    .withMessage("Name must be between 4 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name contains invalid characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: 100 })
    .withMessage("Email must not exceed 100 characters")
    .normalizeEmail(),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .matches(/^[\d\s+()-]+$/)
    .withMessage("Phone number contains invalid format"),

  body("companyName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company name must not exceed 100 characters"),

  body("serviceInterest").trim().notEmpty().withMessage("Message is required"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message must be between 10 and 5000 characters"),
];

export const validateLogin: ValidationChain[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];
