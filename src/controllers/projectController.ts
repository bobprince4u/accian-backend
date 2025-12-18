import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ProjectRow {
  id: number;
  title: string;
  slug: string;
  industry: string;
  project_type: string;
  description: string;
  technology_stack: string;
  results: string;
  image_url: string;
  featured: boolean;
  created_at: string;

  // Optional fields (single project)
  challenge?: string;
  solution?: string;
  client_name?: string;
  client_position?: string;
  client_company?: string;
  testimonial?: string;
}

// ─────────────────────────────────────────────────────────────
// Get All Projects
// GET /api/projects?featured=true&limit=10&page=1
// ─────────────────────────────────────────────────────────────

export const getAllProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { featured, limit = "10", page = "1" } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const offset = (pageNum - 1) * limitNum;

    console.log("📂 Fetching projects:", { featured, limit, page });

    let queryText = `
            SELECT 
                id, title, slug, industry, project_type, description,
                technology_stack, results, image_url, featured, created_at
            FROM projects
            WHERE published = true
        `;

    const queryParams: any[] = [];

    if (featured === "true") {
      queryText += " AND featured = true";
    }

    queryText += ` ORDER BY order_index ASC, created_at DESC LIMIT $1 OFFSET $2`;
    queryParams.push(limitNum, offset);

    const result = await query(queryText, queryParams);

    // Total count
    let countQuery = "SELECT COUNT(*) FROM projects WHERE published = true";
    if (featured === "true") {
      countQuery += " AND featured = true";
    }

    const countResult = await query(countQuery);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      success: true,
      data: result.rows.map((project: ProjectRow) => ({
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
  } catch (error) {
    console.error("❌ Get projects error:", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Get Project By Slug
// GET /api/projects/:slug
// ─────────────────────────────────────────────────────────────

export const getProjectBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    console.log("📂 Fetching project by slug:", slug);

    const result = await query(
      `SELECT 
                p.id, p.title, p.slug, p.industry, p.project_type,
                p.description, p.challenge, p.solution, p.technology_stack,
                p.results, p.image_url, p.featured,
                p.client_name, p.client_position, p.client_company, p.testimonial,
                p.created_at
            FROM projects p
            WHERE p.slug = $1 AND p.published = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    const project: ProjectRow = result.rows[0];

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
  } catch (error) {
    console.error("❌ Get project by slug error:", error);
    next(error);
  }
};
