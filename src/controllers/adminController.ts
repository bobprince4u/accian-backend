import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/auth";
import { query } from "../config/database";

// ========================
// Types
// ========================
interface AdminUser {
  id: string; // Changed from number to string
  email: string;
  full_name: string;
  role: string;
  username: string;
  password_hash: string;
  active: boolean;
  last_login: Date | null;
}

interface UserPayload {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface Contact {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: Date;
  updated_at: Date | null;
}

interface Project {
  id: number;
  title: string;
  slug: string;
  industry: string;
  project_type: string;
  description: string;
  challenge: string;
  solution: string;
  technology_stack: string;
  results: string;
  client_name: string;
  client_company: string;
  client_position: string;
  testimonial: string;
  featured: boolean;
  image_url: string;
  published: boolean;
  updated_at: Date;
}

// ========================
// Admin Signup / Create Account
// ========================
export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, fullName, role, username } = req.body;

    if (!email || !password || !fullName || !role || !username) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: email, password, fullName, role",
      });
    }

    // Check if user already exists
    const existingUser = await query(
      "SELECT * FROM admin_users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Admin user with this email already exists",
      });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new admin user
    const result = await query(
      `INSERT INTO admin_users (email, password_hash, full_name, role, username, active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id, email, full_name, role, username`,
      [email, passwordHash, fullName, role, username]
    );

    const newUser: AdminUser = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        username: newUser.username,
      },
    });
  } catch (error: unknown) {
    console.error(
      "❌ Create admin error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ========================
// Admin Login
// ========================
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // --- DEBUGGING STEP 1: Check the entire incoming request body ---
    console.log("🔐 [DEBUG] Full incoming request body:", req.body);

    const { email, password } = req.body;

    // This check is important if the body is empty or missing fields
    if (!email || !password) {
      console.log(
        "❌ [DEBUG] Login failed: Email or password is missing from the request body."
      );
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log(`🔍 [DEBUG] Searching for user with email: "${email}"`);

    const result = await query(
      "SELECT * FROM admin_users WHERE email = $1 AND active = true",
      [email]
    );

    // --- DEBUGGING STEP 2: Check the result of the database query ---
    console.log("🔍 [DEBUG] Database query result:", result.rows);

    if (result.rows.length === 0) {
      console.log(
        "❌ [DEBUG] Login failed: User not found in the database or is inactive."
      );
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0] as AdminUser;
    console.log(`✅ [DEBUG] User found in database: ${user.email}`);

    const validPassword = await bcrypt.compare(password, user.password_hash);

    // --- DEBUGGING STEP 3: Check the password comparison ---
    console.log(
      `🔐 [DEBUG] Password comparison result for ${user.email}:`,
      validPassword
    );

    if (!validPassword) {
      console.log(
        "❌ [DEBUG] Login failed: Password does not match the hash in the database."
      );
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    await query("UPDATE admin_users SET last_login = $1 WHERE id = $2", [
      new Date(),
      user.id,
    ]);

    // Create user payload that matches UserPayload interface
    const userPayload: UserPayload = {
      id: user.id.toString(), // Convert number to string
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };

    const token = generateToken(userPayload);

    console.log(
      "✅ [DEBUG] Login successful! Token generated for user:",
      userPayload.email
    );

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error: unknown) {
    console.error(
      "❌ [DEBUG] An unexpected error occurred during login:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ✅ DEFINE FIRST
const normalizeStatus = (status?: string) => {
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
/// ========================
// Get All Contacts
// ========================
export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("📬 Fetching all contacts for admin dashboard...");

    const result = await query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );

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
  } catch (error: unknown) {
    console.error("❌ Get all contacts error:", error);
    next(error as Error);
  }
};

// ========================
// Get Contact by ID
// ========================
export const getContactById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Contact ID is required",
      });
    }

    console.log(`🔍 Fetching contact with ID: ${id}`);

    const result = await query("SELECT * FROM contacts WHERE id = $1", [id]);

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
  } catch (error: unknown) {
    console.error(
      "❌ Get contact by ID error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ========================
// Helper: Map Database Status to Frontend Status
// ========================
function mapDatabaseStatus(
  dbStatus: string
): "New" | "Contacted" | "In Progress" | "Converted" | "Closed" {
  const statusMap: Record<
    string,
    "New" | "Contacted" | "In Progress" | "Converted" | "Closed"
  > = {
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
export const updateContactStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Map frontend status to database status
    const statusMap: Record<string, string> = {
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

    const result = await query(
      "UPDATE contacts SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *",
      [dbStatus, new Date(), id]
    );

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
  } catch (error: unknown) {
    console.error(
      "❌ Update status error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ========================
// Delete Contact
// ========================
export const deleteContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM contacts WHERE id = $1 RETURNING id",
      [id]
    );

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
  } catch (error: unknown) {
    console.error(
      "❌ Delete contact error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ========================
// Dashboard Stats
// ========================
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("📊 Fetching dashboard stats...");

    const [contacts, projects, newContacts, recent] = await Promise.all([
      query("SELECT COUNT(*) as total FROM contacts"),
      query("SELECT COUNT(*) as total FROM projects WHERE published = true"),
      query("SELECT COUNT(*) as total FROM contacts WHERE status = 'new'"),
      query("SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5"),
    ]);

    return res.json({
      success: true,
      data: {
        totalContacts: parseInt(contacts.rows[0].total as string),
        totalProjects: parseInt(projects.rows[0].total as string),
        newContacts: parseInt(newContacts.rows[0].total as string),
        recentContacts: recent.rows,
      },
    });
  } catch (error: unknown) {
    console.error(
      "❌ Dashboard stats error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ========================
// Create Project
// ========================
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
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
      featured,
      imageUrl,
    } = req.body;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const result = await query(
      `INSERT INTO projects (
                title, slug, industry, project_type, description,
                challenge, solution, technology_stack, results,
                client_name, client_company, client_position, testimonial,
                featured, image_url, published
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                $10, $11, $12, $13,
                $14, $15, true
            ) RETURNING id, slug`,
      [
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
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Project created",
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error(
      "❌ Create project error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ========================
// Update Project
// ========================
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;

    const keys = Object.keys(updates).filter((k) => updates[k] !== undefined);
    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const values = keys.map((key) => updates[key]);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");

    const result = await query(
      `UPDATE projects SET ${setClause}, updated_at = $${keys.length + 1} 
             WHERE id = $${keys.length + 2} RETURNING *`,
      [...values, new Date(), id]
    );

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
  } catch (error: unknown) {
    console.error(
      "❌ Update project error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ========================
// GET ALL Project
// ========================

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      "SELECT * FROM projects WHERE published = true ORDER BY updated_at DESC"
    );

    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: unknown) {
    console.error(
      "❌ Get all projects error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

// ========================
// Delete (Unpublish) Project
// ========================
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE projects SET published = false WHERE id = $1 RETURNING id",
      [id]
    );

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
  } catch (error: unknown) {
    console.error(
      "❌ Delete project error:",
      error instanceof Error ? error.message : String(error)
    );
    next(error as Error);
  }
};

/**
 * Get all services (Admin)
 * GET /api/admin/services
 */
export const getServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("📋 Fetching all services (admin)");

    const result = await query(
      "SELECT * FROM services ORDER BY order_index ASC, created_at ASC"
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error("❌ Get services error:", error);
    next(error);
  }
};

/**
 * Get all testimonials (Admin)
 * GET /api/admin/testimonials
 */
export const getTestimonials = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20 } = req.query as {
      page?: string;
      limit?: string;
    };
    const pageNum = parseInt(page as unknown as string) || 1;
    const limitNum = parseInt(limit as unknown as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    console.log("📋 Fetching all testimonials (admin)");

    const result = await query(
      `SELECT t.*, p.title as project_title, p.slug as project_slug
       FROM testimonials t
       LEFT JOIN projects p ON t.project_id = p.id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limitNum, offset]
    );

    // Get total count
    const countResult = await query("SELECT COUNT(*) FROM testimonials");
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("❌ Get testimonials error:", error);
    next(error);
  }
};
