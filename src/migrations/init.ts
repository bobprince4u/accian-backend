import { query } from "../config/database";

export async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");

    // Create contacts table
    await query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        reference_number VARCHAR(50) UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        service_interest VARCHAR(100),
        project_budget VARCHAR(50),
        project_timeline VARCHAR(50),
        message TEXT NOT NULL,
        how_heard VARCHAR(100),
        ip_address VARCHAR(50),
        user_agent TEXT,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Contacts table created/verified");

    // Create projects table
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        industry VARCHAR(100),
        project_type VARCHAR(100),
        description TEXT,
        challenge TEXT,
        solution TEXT,
        technology_stack TEXT[],
        results TEXT,
        client_name VARCHAR(255),
        client_company VARCHAR(255),
        client_position VARCHAR(255),
        testimonial TEXT,
        featured BOOLEAN DEFAULT false,
        published BOOLEAN DEFAULT true,
        image_url VARCHAR(500),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Projects table created/verified");

    // Create services table
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        icon VARCHAR(100),
        short_description TEXT,
        full_description TEXT,
        features TEXT[],
        technology_stack TEXT[],
        process_steps TEXT[],
        ideal_for TEXT[],
        order_index INTEGER DEFAULT 0,
        published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Services table created/verified");

    // Create testimonials table
    await query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_position VARCHAR(255),
        client_company VARCHAR(255),
        testimonial_text TEXT NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        project_id INTEGER REFERENCES projects(id),
        featured BOOLEAN DEFAULT false,
        published BOOLEAN DEFAULT true,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Testimonials table created/verified");

    // Create admin_users table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Admin users table created/verified");

    // Create email_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        email_type VARCHAR(50) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        metadata JSONB,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Email logs table created/verified");

    // Create indexes
    await query(
      `CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(featured)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(email)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status)`
    );
    console.log("✅ Indexes created/verified");

    // ============================================
    // SEED DATA
    // ============================================

    // Seed testimonials
    console.log("📝 Checking testimonials data...");
    const testimonialsCount = await query(`SELECT COUNT(*) FROM testimonials`);

    if (parseInt(testimonialsCount.rows[0].count) === 0) {
      console.log("📝 Seeding testimonials data...");
      await query(`
        INSERT INTO testimonials (client_name, client_position, client_company, testimonial_text, rating, featured, published) VALUES
        ('Adebayo Johnson', 'CTO', 'TechVenture Nigeria', 'ACCIAN''s technical expertise and professionalism are unmatched. They delivered our complex enterprise system on time and within budget, exceeding all our expectations.', 5, true, true),
        ('Oluwaseun Adeyemi', 'Managing Director', 'Enterprise Solutions Group', 'ACCIAN doesn''t just build software—they solve business problems. Their strategic approach and technical execution helped us streamline operations and grow revenue.', 5, false, true),
        ('Chioma Okafor', 'IT Director', 'Financial Solutions Ltd', 'The cybersecurity audit conducted by ACCIAN was thorough and eye-opening. Their recommendations significantly strengthened our security posture and helped us achieve compliance certification.', 5, true, true)
      `);
      console.log("✅ Testimonials seeded: 3 records");
    } else {
      console.log(
        `ℹ️  Testimonials already exist: ${testimonialsCount.rows[0].count} records`
      );
    }

    // Seed services
    console.log("📝 Checking services data...");
    const servicesCount = await query(`SELECT COUNT(*) FROM services`);

    if (parseInt(servicesCount.rows[0].count) === 0) {
      console.log("📝 Seeding services data...");
      await query(`
        INSERT INTO services (title, slug, icon, short_description, full_description, features, published) VALUES
('IT Consulting & Advisory', 'it-consulting-advisory', 'Lightbulb', 
 'Strategic technology guidance to support growth and efficiency.', 
 'We help organisations plan, implement, and optimize their IT systems through expert advice and practical solutions.',
 ARRAY['IT strategy and digital transformation', 'Systems analysis and architecture design', 'Cybersecurity and data protection advisory', 'Cloud and infrastructure consulting', 'Technology project management'],
 true),

('Business & Domestic Software Development', 'business-domestic-software-development', 'Code',
 'Custom software solutions built around real-world needs.',
 'We design, develop, and maintain secure, scalable software for businesses and individuals.',
 ARRAY['Web and mobile application development', 'Custom business systems and automation', 'SaaS product development', 'Software maintenance and support', 'Integration with third-party platforms'],
 true),

('Education & Training', 'education-training', 'GraduationCap',
 'Practical learning for skills, careers, and personal development.',
 'We deliver flexible education and training programmes tailored to professional and community needs.',
 ARRAY['Professional and vocational training', 'Digital and technology skills courses', 'Workshops, seminars, and online learning', 'Business and personal development programmes'],
 true),

('Social Care & Community Support', 'social-care-community-support', 'Heart',
 'Supporting independence, well-being, and quality of life.',
 'Providing compassionate care and support services to help individuals maintain independence and quality of life.',
 ARRAY['Domiciliary and home-based support', 'Personal care and daily living assistance', 'Companionship and wellbeing support', 'Community-based social work services', 'Support for independent living'],
 true),

('Data Science, AI & Predictive Analytics', 'data-science-ai-predictive-analytics', 'Brain',
 'Advanced data science solutions for informed decision making.',
 'Advanced data science solutions including machine learning modelling, financial risk analysis, and predictive analytics.',
 ARRAY['Machine Learning Modelling', 'Financial Risk Modelling', 'Predictive Analytics', 'Big Data Analytics'],
 true)

      `);
      console.log("✅ Services seeded: 5 records");
    } else {
      console.log(
        `ℹ️  Services already exist: ${servicesCount.rows[0].count} records`
      );
    }

    console.log("✅ All migrations and seeding completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    if (error instanceof Error) {
      console.error("Details:", error.message);
    }
  }
}
