import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";

interface ProjectData {
  id: number;
  title: string;
  slug: string;
}

interface Testimonial {
  id: number;
  client_name: string;
  client_position: string | null;
  client_company: string | null;
  testimonial_text: string;
  rating: number | null;
  featured: boolean;
  image_url: string | null;
  project_id: number | null;
  project_title?: string;
  project_slug?: string;
  created_at: string;
}

export const getAllTestimonials = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      featured,
      limit = "10",
      page = "1",
    } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log("📂 Fetching testimonials:", { featured, limit, page });

    let queryText = `
            SELECT 
                t.id, t.client_name, t.client_position, t.client_company,
                t.testimonial_text, t.rating, t.featured, t.image_url,
                t.created_at, t.project_id,
                p.title as project_title, p.slug as project_slug
            FROM testimonials t
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE t.published = true
        `;

    const queryParams: (string | number | boolean)[] = [];

    if (featured === "true") {
      queryText += " AND t.featured = true";
    }

    queryText += ` ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`;
    queryParams.push(parseInt(limit), offset);

    const result = await query(queryText, queryParams);

    let countQuery = "SELECT COUNT(*) FROM testimonials WHERE published = true";
    if (featured === "true") {
      countQuery += " AND featured = true";
    }
    const countResult = await query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows.map((testimonial: Testimonial) => ({
        id: testimonial.id,
        clientName: testimonial.client_name,
        clientPosition: testimonial.client_position,
        clientCompany: testimonial.client_company,
        testimonialText: testimonial.testimonial_text,
        rating: testimonial.rating,
        featured: testimonial.featured,
        imageUrl: testimonial.image_url,
        project: testimonial.project_id
          ? {
              id: testimonial.project_id,
              title: testimonial.project_title,
              slug: testimonial.project_slug,
            }
          : null,
        createdAt: testimonial.created_at,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Get testimonials error:", error);
    next(error);
  }
};

export const getTestimonialById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    console.log("📂 Fetching testimonial by ID:", id);

    const result = await query(
      `
            SELECT 
                t.id, t.client_name, t.client_position, t.client_company,
                t.testimonial_text, t.rating, t.featured, t.image_url,
                t.created_at, t.project_id,
                p.title as project_title, p.slug as project_slug
            FROM testimonials t
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE t.id = $1 AND t.published = true
        `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    const testimonial: Testimonial = result.rows[0];

    res.json({
      success: true,
      data: {
        id: testimonial.id,
        clientName: testimonial.client_name,
        clientPosition: testimonial.client_position,
        clientCompany: testimonial.client_company,
        testimonialText: testimonial.testimonial_text,
        rating: testimonial.rating,
        featured: testimonial.featured,
        imageUrl: testimonial.image_url,
        project: testimonial.project_id
          ? {
              id: testimonial.project_id,
              title: testimonial.project_title,
              slug: testimonial.project_slug,
            }
          : null,
        createdAt: testimonial.created_at,
      },
    });
  } catch (error) {
    console.error("❌ Get testimonial by ID error:", error);
    next(error);
  }
};

export const createTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      clientName,
      clientPosition,
      clientCompany,
      testimonialText,
      rating,
      projectId,
      featured,
      imageUrl,
    } = req.body;

    console.log("📝 Creating testimonial for:", clientName);

    if (!clientName || !testimonialText) {
      return res.status(400).json({
        success: false,
        message: "Client name and testimonial text are required",
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const result = await query(
      `
            INSERT INTO testimonials (
                client_name, client_position, client_company,
                testimonial_text, rating, project_id, featured,
                image_url, published
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING id
        `,
      [
        clientName,
        clientPosition || null,
        clientCompany || null,
        testimonialText,
        rating || null,
        projectId || null,
        featured || false,
        imageUrl || null,
      ]
    );

    console.log("✅ Testimonial created");

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      data: {
        id: result.rows[0].id,
      },
    });
  } catch (error) {
    console.error("❌ Create testimonial error:", error);
    next(error);
  }
};

export const updateTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = req.body;

    console.log("📝 Updating testimonial:", id);

    if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const filteredUpdates: Record<string, any> = {};
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    });

    const keys = Object.keys(filteredUpdates);
    const values = Object.values(filteredUpdates);

    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const result = await query(
      `UPDATE testimonials SET ${setClause} WHERE id = $${
        keys.length + 1
      } RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    console.log("✅ Testimonial updated");

    res.json({
      success: true,
      message: "Testimonial updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Update testimonial error:", error);
    next(error);
  }
};

export const deleteTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Deleting (unpublishing) testimonial:", id);

    const result = await query(
      "UPDATE testimonials SET published = false WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    console.log("✅ Testimonial unpublished");

    res.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete testimonial error:", error);
    next(error);
  }
};
