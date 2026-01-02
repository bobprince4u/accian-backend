"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestimonials = exports.getServices = exports.deleteProject = exports.getProjects = exports.updateProject = exports.createProject = exports.getDashboardStats = exports.deleteContact = exports.updateContactStatus = exports.getContactById = exports.getContacts = exports.logout = exports.login = exports.refreshToken = exports.createAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const token_1 = require("../utils/token");
// ========================
// Admin Signup / Create Account
// ========================
const createAdmin = async (req, res, next) => {
    try {
        const { email, password, fullName, role, username } = req.body;
        if (!email || !password || !fullName || !role || !username) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }
        // 🚨 BLOCK SIGNUP IF ADMIN ALREADY EXISTS
        const adminCount = await (0, database_1.query)("SELECT COUNT(*) FROM admin_users");
        if (Number(adminCount.rows[0].count) > 0) {
            return res.status(403).json({
                success: false,
                message: "Admin signup is disabled",
            });
        }
        // Check for duplicates
        const existingUser = await (0, database_1.query)("SELECT id FROM admin_users WHERE email = $1 OR username = $2", [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Admin user already exists",
            });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Create admin
        const result = await (0, database_1.query)(`INSERT INTO admin_users 
       (email, password_hash, full_name, role, username, active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id, email, full_name, role, username`, [email, passwordHash, fullName, role, username]);
        return res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error("❌ Create admin error:", error);
        next(error);
    }
};
exports.createAdmin = createAdmin;
// ========================
// Refresh Token
// ========================
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(401).json({ message: "Missing refresh token" });
    const stored = await (0, database_1.query)("SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false", [refreshToken]);
    if (!stored.rows.length)
        return res.status(403).json({ message: "Invalid refresh token" });
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = (0, token_1.generateAccessToken)({
            id: decoded.id,
        });
        res.json({ accessToken: newAccessToken });
    }
    catch {
        return res.status(403).json({ message: "Expired refresh token" });
    }
};
exports.refreshToken = refreshToken;
// ========================
// Admin Login
// ========================
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // This check is important if the body is empty or missing fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const result = await (0, database_1.query)("SELECT * FROM admin_users WHERE email = $1 AND active = true", [normalizedEmail]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        const user = result.rows[0];
        const validPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        // Update last login timestamp
        await (0, database_1.query)("UPDATE admin_users SET last_login = NOW() WHERE id = $1", [
            user.id,
        ]);
        // Create user payload that matches TokenPayload interface
        const tokenPayload = {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
        };
        // ✅ User payload - complete (includes fullName for frontend)
        const userPayload = {
            id: user.id.toString(),
            email: user.email,
            fullName: user.full_name,
            role: user.role,
        };
        // Generate tokens
        const accessToken = (0, token_1.generateAccessToken)(tokenPayload); // short-lived token
        const refreshToken = (0, token_1.generateRefreshToken)({ id: user.id }); // long-lived token
        // Store refresh token in DB
        await (0, database_1.query)(`INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`, [user.id, refreshToken]);
        console.log("✅ [DEBUG] Login successful! Token generated for user:", userPayload.email);
        return res.json({
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                refreshToken,
                user: userPayload,
            },
        });
    }
    catch (error) {
        console.error("❌ [DEBUG] An unexpected error occurred during login:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.login = login;
// ✅ DEFINE FIRST
const normalizeStatus = (status) => {
    switch (status) {
        case "new":
            return "New";
        case "contacted":
            return "Contacted";
        case "in_progress":
            return "In Progress";
        case "converted":
            return "Converted";
        case "closed":
            return "Closed";
        default:
            return "New";
    }
};
// Logout - invalidate refresh token
const logout = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ message: "Missing refresh token" });
    await (0, database_1.query)("UPDATE refresh_tokens SET revoked = true WHERE token = $1", [
        refreshToken,
    ]);
    res.json({ success: true, message: "Logged out successfully" });
};
exports.logout = logout;
/// ========================
// Get All Contacts
// ========================
const getContacts = async (req, res, next) => {
    try {
        console.log("📬 Fetching all contacts for admin dashboard...");
        const result = await (0, database_1.query)("SELECT * FROM contacts ORDER BY created_at DESC");
        // MAP snake_case to camelCase
        const contacts = result.rows.map((row) => ({
            id: row.id,
            fullName: row.full_name,
            email: row.email,
            company: row.company_name || "",
            phone: row.phone || "",
            service: row.service_interest || "",
            budget: row.project_budget || "",
            timeline: row.project_timeline || "",
            message: row.message || "",
            hearAbout: row.how_heard || "",
            status: normalizeStatus(row.status),
            createdAt: row.created_at,
            lastUpdated: row.updated_at || row.created_at,
        }));
        console.log("✅ Backend mapped contact:", contacts[0]);
        res.status(200).json({
            success: true,
            data: contacts, // Send mapped data
            count: contacts.length,
        });
    }
    catch (error) {
        console.error("❌ Get all contacts error:", error);
        next(error);
    }
};
exports.getContacts = getContacts;
// ========================
// Get Contact by ID
// ========================
const getContactById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Contact ID is required",
            });
        }
        console.log(`🔍 Fetching contact with ID: ${id}`);
        const result = await (0, database_1.query)("SELECT * FROM contacts WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Contact not found",
            });
        }
        const row = result.rows[0];
        // Map database fields to frontend field names
        const contact = {
            id: row.id,
            fullName: row.full_name,
            email: row.email,
            company: row.company_name || "",
            phone: row.phone || "",
            service: row.service_interest || "",
            budget: row.project_budget || "",
            timeline: row.project_timeline || "",
            message: row.message || "",
            hearAbout: row.how_heard || "",
            status: mapDatabaseStatus(row.status),
            createdAt: row.created_at,
            lastUpdated: row.updated_at || row.created_at,
        };
        res.status(200).json({
            success: true,
            data: contact,
        });
    }
    catch (error) {
        console.error("❌ Get contact by ID error:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.getContactById = getContactById;
// ========================
// Helper: Map Database Status to Frontend Status
// ========================
function mapDatabaseStatus(dbStatus) {
    const statusMap = {
        new: "New",
        contacted: "Contacted",
        "in-progress": "In Progress",
        converted: "Converted",
        closed: "Closed",
    };
    return statusMap[dbStatus] || "New";
}
// ========================
// Update Contact Status
// ========================
const updateContactStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Map frontend status to database status
        const statusMap = {
            New: "new",
            Contacted: "contacted",
            "In Progress": "in-progress",
            Converted: "converted",
            Closed: "closed",
        };
        const dbStatus = statusMap[status];
        if (!dbStatus) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }
        const result = await (0, database_1.query)("UPDATE contacts SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *", [dbStatus, new Date(), id]);
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Contact not found" });
        }
        const row = result.rows[0];
        // Map database fields to frontend field names
        const contact = {
            id: row.id,
            fullName: row.full_name,
            email: row.email,
            company: row.company_name || "",
            phone: row.phone || "",
            service: row.service_interest || "",
            budget: row.project_budget || "",
            timeline: row.project_timeline || "",
            message: row.message || "",
            hearAbout: row.how_heard || "",
            status: mapDatabaseStatus(row.status),
            createdAt: row.created_at,
            lastUpdated: row.updated_at || row.created_at,
        };
        return res.json({
            success: true,
            message: "Status updated successfully",
            data: contact,
        });
    }
    catch (error) {
        console.error("❌ Update status error:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.updateContactStatus = updateContactStatus;
// ========================
// Delete Contact
// ========================
const deleteContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, database_1.query)("DELETE FROM contacts WHERE id = $1 RETURNING id", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Contact not found",
            });
        }
        return res.json({
            success: true,
            message: "Contact deleted successfully",
        });
    }
    catch (error) {
        console.error("❌ Delete contact error:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.deleteContact = deleteContact;
// ========================
// Dashboard Stats
// ========================
const getDashboardStats = async (req, res, next) => {
    try {
        console.log("📊 Fetching dashboard stats...");
        const [contacts, projects, newContacts, recent] = await Promise.all([
            (0, database_1.query)("SELECT COUNT(*) as total FROM contacts"),
            (0, database_1.query)("SELECT COUNT(*) as total FROM projects WHERE published = true"),
            (0, database_1.query)("SELECT COUNT(*) as total FROM contacts WHERE status = 'new'"),
            (0, database_1.query)("SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5"),
        ]);
        return res.json({
            success: true,
            data: {
                totalContacts: parseInt(contacts.rows[0].total),
                totalProjects: parseInt(projects.rows[0].total),
                newContacts: parseInt(newContacts.rows[0].total),
                recentContacts: recent.rows,
            },
        });
    }
    catch (error) {
        console.error("❌ Dashboard stats error:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
// ========================
// Create Project
// ========================
const createProject = async (req, res, next) => {
    try {
        const { title, industry, projectType, description, challenge, solution, technologyStack, results, clientName, clientCompany, clientPosition, testimonial, featured, imageUrl, } = req.body;
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        const result = await (0, database_1.query)(`INSERT INTO projects (
                title, slug, industry, project_type, description,
                challenge, solution, technology_stack, results,
                client_name, client_company, client_position, testimonial,
                featured, image_url, published
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                $10, $11, $12, $13,
                $14, $15, true
            ) RETURNING id, slug`, [
            title,
            slug,
            industry,
            projectType,
            description,
            challenge,
            solution,
            technologyStack,
            results,
            clientName,
            clientCompany,
            clientPosition,
            testimonial,
            featured ?? false,
            imageUrl,
        ]);
        return res.status(201).json({
            success: true,
            message: "Project created",
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error("❌ Create project error:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.createProject = createProject;
// ========================
// Update Project
// ========================
const updateProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const keys = Object.keys(updates).filter((k) => updates[k] !== undefined);
        if (keys.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update",
            });
        }
        const values = keys.map((key) => updates[key]);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
        const result = await (0, database_1.query)(`UPDATE projects SET ${setClause}, updated_at = $${keys.length + 1} 
             WHERE id = $${keys.length + 2} RETURNING *`, [...values, new Date(), id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }
        return res.json({
            success: true,
            message: "Project updated",
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error("❌ Update project error:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.updateProject = updateProject;
// ========================
// GET ALL Project
// ========================
const getProjects = async (req, res, next) => {
    try {
        const result = await (0, database_1.query)("SELECT * FROM projects WHERE published = true ORDER BY updated_at DESC");
        return res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        console.error("❌ Get all projects error:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.getProjects = getProjects;
// ========================
// Delete (Unpublish) Project
// ========================
const deleteProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, database_1.query)("UPDATE projects SET published = false WHERE id = $1 RETURNING id", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }
        return res.json({
            success: true,
            message: "Project unpublished",
        });
    }
    catch (error) {
        console.error("❌ Delete project error:", error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.deleteProject = deleteProject;
/**
 * Get all services (Admin)
 * GET /api/admin/services
 */
const getServices = async (req, res, next) => {
    try {
        console.log("📋 Fetching all services (admin)");
        const result = await (0, database_1.query)("SELECT * FROM services ORDER BY order_index ASC, created_at ASC");
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        console.error("❌ Get services error:", error);
        next(error);
    }
};
exports.getServices = getServices;
/**
 * Get all testimonials (Admin)
 * GET /api/admin/testimonials
 */
const getTestimonials = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;
        console.log("📋 Fetching all testimonials (admin)");
        const result = await (0, database_1.query)(`SELECT t.*, p.title as project_title, p.slug as project_slug
       FROM testimonials t
       LEFT JOIN projects p ON t.project_id = p.id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`, [limitNum, offset]);
        // -----------------------------
        // Add normalization step
        // -----------------------------
        const normalizeTestimonial = (row) => ({
            id: String(row.id), // or row.id if already string
            name: row.client_name || "Anonymous",
            position: row.client_position || "",
            company: row.client_company || "",
            message: row.testimonial_text || "",
            rating: Number(row.rating ?? 5),
            featured: Boolean(row.featured),
            image: row.image_url || null,
            createdAt: row.created_at,
            project: {
                id: row.project_id,
                // optional: you can also join projects to get title/slug
            },
        });
        const testimonials = result.rows.map(normalizeTestimonial);
        console.log("First testimonial row:", result.rows[0]);
        // Get total count
        const countResult = await (0, database_1.query)("SELECT COUNT(*) FROM testimonials");
        const total = parseInt(countResult.rows[0].count);
        res.json({
            success: true,
            data: result.rows.map(normalizeTestimonial),
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("❌ Get testimonials error:", error);
        next(error);
    }
};
exports.getTestimonials = getTestimonials;
