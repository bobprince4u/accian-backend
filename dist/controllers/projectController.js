"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectBySlug = exports.getAllProjects = void 0;
const database_1 = require("../config/database");
// ─────────────────────────────────────────────────────────────
// Get All Projects
// GET /api/projects?featured=true&limit=10&page=1
// ─────────────────────────────────────────────────────────────
const getAllProjects = async (req, res, next) => {
    try {
        const { featured, limit = "10", page = "1" } = req.query;
        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);
        const offset = (pageNum - 1) * limitNum;
        console.log("📂 Fetching projects:", { featured, limit, page });
        let queryText = `
            SELECT 
                id, title, slug, industry, project_type, description,
                technology_stack, results, image_url, featured, created_at
            FROM projects
            WHERE published = true
        `;
        const queryParams = [];
        if (featured === "true") {
            queryText += " AND featured = true";
        }
        queryText += ` ORDER BY order_index ASC, created_at DESC LIMIT $1 OFFSET $2`;
        queryParams.push(limitNum, offset);
        const result = await (0, database_1.query)(queryText, queryParams);
        // Total count
        let countQuery = "SELECT COUNT(*) FROM projects WHERE published = true";
        if (featured === "true") {
            countQuery += " AND featured = true";
        }
        const countResult = await (0, database_1.query)(countQuery);
        const total = parseInt(countResult.rows[0].count, 10);
        res.json({
            success: true,
            data: result.rows.map((project) => ({
                id: project.id,
                title: project.title,
                slug: project.slug,
                industry: project.industry,
                projectType: project.project_type,
                description: project.description,
                technologyStack: project.technology_stack,
                results: project.results,
                imageUrl: project.image_url,
                featured: project.featured,
                createdAt: project.created_at,
            })),
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("❌ Get projects error:", error);
        next(error);
    }
};
exports.getAllProjects = getAllProjects;
// ─────────────────────────────────────────────────────────────
// Get Project By Slug
// GET /api/projects/:slug
// ─────────────────────────────────────────────────────────────
const getProjectBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        console.log("📂 Fetching project by slug:", slug);
        const result = await (0, database_1.query)(`SELECT 
                p.id, p.title, p.slug, p.industry, p.project_type,
                p.description, p.challenge, p.solution, p.technology_stack,
                p.results, p.image_url, p.featured,
                p.client_name, p.client_position, p.client_company, p.testimonial,
                p.created_at
            FROM projects p
            WHERE p.slug = $1 AND p.published = true`, [slug]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Project not found",
            });
            return;
        }
        const project = result.rows[0];
        const formattedProject = {
            id: project.id,
            title: project.title,
            slug: project.slug,
            industry: project.industry,
            projectType: project.project_type,
            description: project.description,
            challenge: project.challenge,
            solution: project.solution,
            technologyStack: project.technology_stack,
            results: project.results,
            imageUrl: project.image_url,
            featured: project.featured,
            testimonial: project.testimonial
                ? {
                    text: project.testimonial,
                    clientName: project.client_name,
                    clientPosition: project.client_position,
                    clientCompany: project.client_company,
                }
                : null,
            createdAt: project.created_at,
        };
        res.json({
            success: true,
            data: formattedProject,
        });
    }
    catch (error) {
        console.error("❌ Get project by slug error:", error);
        next(error);
    }
};
exports.getProjectBySlug = getProjectBySlug;
