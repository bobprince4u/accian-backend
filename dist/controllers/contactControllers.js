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
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContactForm = void 0;
const database_1 = require("../config/database");
const emailService = __importStar(require("../services/emailServices"));
const submitContactForm = async (req, res, next) => {
    try {
        const { fullName, companyName, email, phone, serviceInterest, projectBudget, projectTimeline, message, howHeard, } = req.body;
        console.log("📝 Processing contact form submission from:", email);
        // Capture IP + User-Agent
        const ipAddress = req.ip || req.connection.remoteAddress || "";
        const userAgent = req.get("user-agent") || "";
        // Store contact
        const result = await (0, database_1.query)(`INSERT INTO contacts (
                full_name, company_name, email, phone, 
                service_interest, project_budget, project_timeline, 
                message, how_heard, ip_address, user_agent, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, created_at`, [
            fullName,
            companyName || null,
            email,
            phone || null,
            serviceInterest,
            projectBudget || null,
            projectTimeline || null,
            message,
            howHeard || null,
            ipAddress,
            userAgent,
            "new",
        ]);
        const contactId = result.rows[0].id;
        const referenceNumber = `ACC-${new Date().getFullYear()}-${String(contactId).padStart(4, "0")}`;
        // Update reference number
        await (0, database_1.query)("UPDATE contacts SET reference_number = $1 WHERE id = $2", [
            referenceNumber,
            contactId,
        ]);
        console.log(`✅ Contact saved with ID: ${contactId}, Reference: ${referenceNumber}`);
        // --- Send emails asynchronously (non-blocking) ---
        emailService
            .sendUserConfirmation({
            to: email,
            fullName,
            serviceInterest,
            referenceNumber,
        })
            .catch((err) => {
            if (err instanceof Error) {
                console.error("Email sending error (user):", err.message);
            }
            else {
                console.error("Email sending error (user):", err);
            }
        });
        emailService
            .sendAdminNotification({
            fullName,
            companyName: companyName || "N/A",
            email,
            phone: phone || "N/A",
            serviceInterest,
            projectBudget: projectBudget || "Not specified",
            projectTimeline: projectTimeline || "Not specified",
            message,
            howHeard: howHeard || "Not specified",
            referenceNumber,
            timestamp: result.rows[0].created_at,
        })
            .catch((err) => {
            if (err instanceof Error) {
                console.error("Email sending error (admin):", err.message);
            }
            else {
                console.error("Email sending error (admin):", err);
            }
        });
        // Final API response
        res.status(201).json({
            success: true,
            message: "Thank you for contacting us! We'll be in touch within 24 hours.",
            data: {
                id: contactId,
                referenceNumber,
            },
        });
    }
    catch (error) {
        console.error("❌ Contact form submission error:", error);
        next(error);
    }
};
exports.submitContactForm = submitContactForm;
exports.default = {
    submitContactForm: exports.submitContactForm,
};
