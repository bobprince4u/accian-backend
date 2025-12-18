import nodemailer, { Transporter, SentMessageInfo } from "nodemailer";
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
}

// Create email transporter
const transporter: Transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error: Error | null, success: boolean) => {
  if (error) {
    console.error("❌ Email service error:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

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
  data: Record<string, string | undefined>
): string => {
  let result = template;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, data[key] || "");
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to log email:", errorMessage);
  }
};

// Send user confirmation email
export const sendUserConfirmation = async (
  data: UserConfirmationData
): Promise<{ success: boolean; messageId?: string }> => {
  try {
    const template = await loadTemplate("userConfirmation");
    const html = replacePlaceholders(template, {
      fullName: data.fullName,
      serviceInterest: data.serviceInterest,
      referenceNumber: data.referenceNumber,
    });

    const mailOptions = {
      from: `"ACCIAN Nigeria Limited" <${process.env.EMAIL_USER}>`,
      to: data.to,
      subject: "Thank you for contacting ACCIAN Nigeria Limited",
      html,
    };

    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    await logEmail("user_confirmation", data.to, mailOptions.subject, "sent");

    console.log(`✅ Confirmation email sent to ${data.to}`);
    console.log(`Message ID: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to send user confirmation email:", errorMessage);
    await logEmail(
      "user_confirmation",
      data.to,
      "Confirmation Email",
      "failed",
      errorMessage
    );
    throw error;
  }
};

// Send admin notification email
export const sendAdminNotification = async (
  data: AdminNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const template = await loadTemplate("adminNotification");
    const html = replacePlaceholders(template, {
      ...data,
      timestamp: new Date(data.timestamp).toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
        dateStyle: "full",
        timeStyle: "long",
      }),
    });

    const mailOptions = {
      from: `"ACCIAN Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 New Contact Form Submission - ${data.referenceNumber}`,
      html,
    };

    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    await logEmail(
      "admin_notification",
      process.env.ADMIN_EMAIL,
      mailOptions.subject,
      "sent"
    );

    console.log(`✅ Admin notification email sent`);
    console.log(`Message ID: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to send admin notification email:", errorMessage);
    await logEmail(
      "admin_notification",
      process.env.ADMIN_EMAIL,
      "Admin Notification",
      "failed",
      errorMessage
    );
    return { success: false, error: errorMessage };
  }
};
