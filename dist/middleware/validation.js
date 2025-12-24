"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = exports.contactFormValidationRules = void 0;
const express_validator_1 = require("express-validator");
//Contact form validation rules
exports.contactFormValidationRules = [
    (0, express_validator_1.body)("fullName")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 4, max: 100 })
        .withMessage("Name must be between 4 and 100 characters")
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage("Name contains invalid characters"),
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .isLength({ max: 100 })
        .withMessage("Email must not exceed 100 characters")
        .normalizeEmail(),
    (0, express_validator_1.body)("phone")
        .optional({ checkFalsy: true })
        .trim()
        .notEmpty()
        .withMessage("Message is required")
        .matches(/^[\d\s+()-]+$/)
        .withMessage("Phone number contains invalid format"),
    (0, express_validator_1.body)("companyName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Company name must not exceed 100 characters"),
    (0, express_validator_1.body)("serviceInterest").trim().notEmpty().withMessage("Message is required"),
    (0, express_validator_1.body)("message")
        .trim()
        .notEmpty()
        .withMessage("Message is required")
        .isLength({ min: 10, max: 5000 })
        .withMessage("Message must be between 10 and 5000 characters"),
];
exports.validateLogin = [
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
];
