"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors
            .array()
            .map((err) => {
            // Use type assertion to access additional properties safely
            const errorWithField = err;
            const field = errorWithField.param ||
                errorWithField.path ||
                errorWithField.field ||
                "unknown";
            return {
                field,
                message: err.msg,
            };
        });
        return res.status(400).json({
            success: false,
            message: "Validation errors",
            errors: formattedErrors,
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
