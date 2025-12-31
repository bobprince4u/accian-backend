import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import * as emailService from "../services/emailServices";

interface ContactFormBody {
  fullName: string;
  companyName?: string;
  email: string;
  phone?: string;
  countryCode?: string;
  serviceInterest: string;
  projectBudget?: string;
  projectTimeline?: string;
  message: string;
  howHeard?: string;
  securityToken: string;
  timestamp: number;
  userAgent: string;
}

// Rate limiting storage (in production, use Redis)
const submissionTracker = new Map<string, number[]>();

// Security: Validate timestamp (reject old requests)
const isTimestampValid = (timestamp: number): boolean => {
  const fiveMinutes = 5 * 60 * 1000;
  const age = Date.now() - timestamp;
  return age >= 0 && age <= fiveMinutes;
};

// Security: Check rate limit by IP
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  const submissions = submissionTracker.get(ip) || [];
  const recentSubmissions = submissions.filter((time) => now - time < oneHour);

  if (recentSubmissions.length >= 5) {
    return false; // Too many requests
  }

  recentSubmissions.push(now);
  submissionTracker.set(ip, recentSubmissions);

  // Clean up old entries every hour
  if (Math.random() < 0.01) {
    for (const [key, times] of submissionTracker.entries()) {
      const validTimes = times.filter((t) => now - t < oneHour);
      if (validTimes.length === 0) {
        submissionTracker.delete(key);
      } else {
        submissionTracker.set(key, validTimes);
      }
    }
  }

  return true;
};

// Security: Validate security token format
const isValidSecurityToken = (token: string): boolean => {
  return (
    typeof token === "string" &&
    token.length === 64 &&
    /^[a-f0-9]{64}$/.test(token)
  );
};

// Security: Sanitize input (remove potential XSS)
const sanitize = (input: string): string => {
  return input.replace(/[<>]/g, "").trim().substring(0, 1000);
};

// Security: Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
};

// Security: Validate phone number
const isValidPhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

export const submitContactForm = async (
  req: Request<{}, {}, ContactFormBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      fullName,
      companyName,
      email,
      phone,
      countryCode,
      serviceInterest,
      projectBudget,
      projectTimeline,
      message,
      howHeard,
      securityToken,
      timestamp,
      userAgent,
    } = req.body;

    // Security Check 1: Verify security token from header matches body
    const headerToken = req.get("X-Security-Token");
    if (!headerToken || headerToken !== securityToken) {
      res.status(400).json({
        success: false,
        message: "Invalid security token",
      });
      return;
    }

    // Security Check 2: Validate token format
    if (!isValidSecurityToken(securityToken)) {
      res.status(400).json({
        success: false,
        message: "Invalid security token format",
      });
      return;
    }

    // Security Check 3: Validate timestamp
    if (!timestamp || !isTimestampValid(timestamp)) {
      res.status(400).json({
        success: false,
        message: "Request expired or invalid timestamp",
      });
      return;
    }

    // Security Check 4: Rate limiting by IP
    const ipAddress = (req.ip || req.connection.remoteAddress || "").replace(
      "::ffff:",
      ""
    );
    if (!checkRateLimit(ipAddress)) {
      res.status(429).json({
        success: false,

        message: "Too many requests. Please try again later.",
      });
      return;
    }

    // Validation: Required fields
    if (!fullName || !email || !serviceInterest || !message) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
      return;
    }

    // Validation: Email format
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
      return;
    }

    // Validation: Phone number (if provided)
    if (phone && !isValidPhone(phone)) {
      res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
      return;
    }

    // Sanitize all inputs
    const sanitizedData = {
      fullName: sanitize(fullName),
      companyName: companyName ? sanitize(companyName) : null,
      email: sanitize(email),
      phone: phone || null,
      serviceInterest: sanitize(serviceInterest),
      projectBudget: projectBudget ? sanitize(projectBudget) : null,
      projectTimeline: projectTimeline ? sanitize(projectTimeline) : null,
      message: sanitize(message),
      howHeard: howHeard ? sanitize(howHeard) : null,
    };

    console.log(
      "📝 Processing contact form submission from:",
      sanitizedData.email
    );

    const requestUserAgent = req.get("user-agent") || userAgent || "";

    // Store contact with security info
    const result = await query(
      `INSERT INTO contacts (
        full_name, company_name, email, phone, 
        service_interest, project_budget, project_timeline, 
        message, how_heard, ip_address, user_agent, 
        security_token, submission_timestamp, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, created_at`,
      [
        sanitizedData.fullName,
        sanitizedData.companyName,
        sanitizedData.email,
        sanitizedData.phone,
        sanitizedData.serviceInterest,
        sanitizedData.projectBudget,
        sanitizedData.projectTimeline,
        sanitizedData.message,
        sanitizedData.howHeard,
        ipAddress,
        requestUserAgent,
        securityToken,
        new Date(timestamp),
        "new",
      ]
    );

    const contactId = result.rows[0].id;
    const referenceNumber = `ACC-${new Date().getFullYear()}-${String(
      contactId
    ).padStart(4, "0")}`;

    // Update reference number
    await query("UPDATE contacts SET reference_number = $1 WHERE id = $2", [
      referenceNumber,
      contactId,
    ]);

    console.log(
      `✅ Contact saved with ID: ${contactId}, Reference: ${referenceNumber}`
    );

    // Send emails asynchronously
    emailService
      .sendUserConfirmation({
        to: sanitizedData.email,
        fullName: sanitizedData.fullName,
        serviceInterest: sanitizedData.serviceInterest,
        referenceNumber,
      })
      .catch((err) => console.error("Email sending error (user):", err));

    emailService
      .sendAdminNotification({
        fullName: sanitizedData.fullName,
        companyName: sanitizedData.companyName || "N/A",
        email: sanitizedData.email,
        phone: sanitizedData.phone || "N/A",
        serviceInterest: sanitizedData.serviceInterest,
        projectBudget: sanitizedData.projectBudget || "Not specified",
        projectTimeline: sanitizedData.projectTimeline || "Not specified",
        message: sanitizedData.message,
        howHeard: sanitizedData.howHeard || "Not specified",
        referenceNumber,
        timestamp: result.rows[0].created_at,
      })
      .catch((err) => console.error("Email sending error (admin):", err));

    // Final API response
    res.status(201).json({
      success: true,
      message:
        "Thank you for contacting us! We'll be in touch within 24 hours.",
      data: { id: contactId, referenceNumber },
    });
  } catch (error: unknown) {
    console.error("❌ Contact form submission error:", error);
    next(error);
  }
};

export default { submitContactForm };
