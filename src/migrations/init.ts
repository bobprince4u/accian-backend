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

    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    // Don't throw - allow server to continue even if tables already exist
  }
}
