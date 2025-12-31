import sgMail from "@sendgrid/mail";
import fs from "fs/promises";
import path from "path";
import { query } from "../config/database";

interface UserConfirmationData {
  to: string;
  fullName: string;
  serviceInterest: string;
  referenceNumber: string;
}

interface AdminNotificationData {
  fullName: string;
  companyName?: string;
  email: string;
  phone?: string;
  serviceInterest: string;
  projectBudget?: string;
  projectTimeline?: string;
  message: string;
  howHeard?: string;
  referenceNumber: string;
  timestamp: string | number;
  id?: number;
}

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL =
  process.env.SENDGRID_FROM_EMAIL ||
  process.env.EMAIL_USER ||
  "noreply@accian.co.uk";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("✅ SendGrid initialized");
  console.log(`📧 From Email: ${FROM_EMAIL}`);
} else {
  console.error("❌ SENDGRID_API_KEY not found in environment variables");
}

// Load email template
const loadTemplate = async (templateName: string): Promise<string> => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/emailTemplates",
      `${templateName}.html`
    );
    const template = await fs.readFile(templatePath, "utf-8");
    return template;
  } catch (error: unknown) {
    console.error(
      `Error loading template ${templateName}:`,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

// Replace placeholders in template
const replacePlaceholders = (
  template: string,
  data: Record<string, string | number | undefined>
): string => {
  let result = template;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, String(data[key] || ""));
  });
  return result;
};

// Log email to database
const logEmail = async (
  emailType: string,
  recipientEmail: string | undefined,
  subject: string,
  status: "sent" | "failed",
  errorMessage: string | null = null
): Promise<void> => {
  try {
    await query(
      `INSERT INTO email_logs (email_type, recipient_email, subject, status, error_message, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [emailType, recipientEmail, subject, status, errorMessage, new Date()]
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Failed to log email:", errorMsg);
  }
};

// Send user confirmation email
export const sendUserConfirmation = async (
  data: UserConfirmationData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log(`📤 Attempting to send confirmation email to ${data.to}...`);

    const template = await loadTemplate("userConfirmation");
    const html = replacePlaceholders(template, {
      fullName: data.fullName,
      serviceInterest: data.serviceInterest,
      referenceNumber: data.referenceNumber,
    });

    const msg = {
      to: data.to,
      from: {
        email: FROM_EMAIL,
        name: "ACCIAN Limited",
      },
      subject: "Thank you for contacting ACCIAN Limited",
      html: html,
    };

    const response = await sgMail.send(msg);
    const messageId = response[0].headers["x-message-id"];

    await logEmail("user_confirmation", data.to, msg.subject, "sent");
    console.log(`✅ Confirmation email sent to ${data.to}`);
    console.log(`📬 Message ID: ${messageId}`);

    return { success: true, messageId: messageId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to send user confirmation email:", errorMessage);

    // Log SendGrid-specific error details
    if (error && typeof error === "object" && "response" in error) {
      console.error("SendGrid Error Details:", (error as any).response?.body);
    }

    await logEmail(
      "user_confirmation",
      data.to,
      "Confirmation Email",
      "failed",
      errorMessage
    );

    return { success: false, error: errorMessage };
  }
};

// Send admin notification email
export const sendAdminNotification = async (
  data: AdminNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log(`📤 Attempting to send admin notification...`);

    const template = await loadTemplate("adminNotification");
    const html = replacePlaceholders(template, {
      ...data,
      timestamp: new Date(data.timestamp).toLocaleString("en-NG", {
        timeZone: "UK/England/wales",
        dateStyle: "full",
        timeStyle: "long",
      }),
    });

    const msg = {
      to: ADMIN_EMAIL,
      from: {
        email: FROM_EMAIL,
        name: "ACCIAN Contact Form",
      },
      subject: `🔔 New Contact Form Submission - ${data.referenceNumber}`,
      html: html,
    };

    const response = await sgMail.send(msg);
    const messageId = response[0].headers["x-message-id"];

    await logEmail("admin_notification", ADMIN_EMAIL, msg.subject, "sent");

    console.log(`✅ Admin notification email sent`);
    console.log(`📬 Message ID: ${messageId}`);

    return { success: true, messageId: messageId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to send admin notification email:", errorMessage);

    if (error && typeof error === "object" && "response" in error) {
      console.error("SendGrid Error Details:", (error as any).response?.body);
    }

    await logEmail(
      "admin_notification",
      ADMIN_EMAIL || "",
      "Admin Notification",
      "failed",
      errorMessage
    );

    return { success: false, error: errorMessage };
  }
};
