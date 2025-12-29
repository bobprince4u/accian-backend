import fetch from "node-fetch";
import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import * as emailService from "../services/emailServices";

interface ContactFormBody {
  fullName: string;
  companyName?: string;
  email: string;
  phone?: string;
  serviceInterest: string;
  projectBudget?: string;
  projectTimeline?: string;
  message: string;
  howHeard?: string;
  recaptchaToken: string;
}

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export const submitContactForm = async (
  req: Request<{}, {}, ContactFormBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
      res
        .status(400)
        .json({ success: false, message: "reCAPTCHA token missing" });
      return;
    }

    // Verify with Google
    const secret = process.env.RECAPTCHA_SECRET_KEY!;
    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaToken}`;

    const response = await fetch(verificationURL, { method: "POST" });
    const data = (await response.json()) as RecaptchaResponse;

    if (!data.success) {
      res
        .status(400)
        .json({ success: false, message: "Failed reCAPTCHA verification" });
      return;
    }

    // Extract form fields
    const {
      fullName,
      companyName,
      email,
      phone,
      serviceInterest,
      projectBudget,
      projectTimeline,
      message,
      howHeard,
    } = req.body;

    console.log("📝 Processing contact form submission from:", email);

    // Capture IP + User-Agent
    const ipAddress = req.ip || req.connection.remoteAddress || "";
    const userAgent = req.get("user-agent") || "";

    // Store contact
    const result = await query(
      `INSERT INTO contacts (
        full_name, company_name, email, phone, 
        service_interest, project_budget, project_timeline, 
        message, how_heard, ip_address, user_agent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, created_at`,
      [
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
        to: email,
        fullName,
        serviceInterest,
        referenceNumber,
      })
      .catch((err) => console.error("Email sending error (user):", err));

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
