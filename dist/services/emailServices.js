"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminNotification = exports.sendUserConfirmation = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL =
  process.env.SENDGRID_FROM_EMAIL ||
  process.env.EMAIL_USER ||
  "noreply@accian.co.uk";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (SENDGRID_API_KEY) {
  mail_1.default.setApiKey(SENDGRID_API_KEY);
  console.log("✅ SendGrid initialized");
  console.log(`📧 From Email: ${FROM_EMAIL}`);
} else {
  console.error("❌ SENDGRID_API_KEY not found in environment variables");
}
// Load email template
const loadTemplate = async (templateName) => {
  try {
    const templatePath = path_1.default.join(
      __dirname,
      "../templates/emailTemplates",
      `${templateName}.html`
    );
    const template = await promises_1.default.readFile(templatePath, "utf-8");
    return template;
  } catch (error) {
    console.error(
      `Error loading template ${templateName}:`,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};
// Replace placeholders in template
const replacePlaceholders = (template, data) => {
  let result = template;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, String(data[key] || ""));
  });
  return result;
};
// Log email to database
const logEmail = async (
  emailType,
  recipientEmail,
  subject,
  status,
  errorMessage = null
) => {
  try {
    await (0, database_1.query)(
      `INSERT INTO email_logs (email_type, recipient_email, subject, status, error_message, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [emailType, recipientEmail, subject, status, errorMessage, new Date()]
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Failed to log email:", errorMsg);
  }
};
// Send user confirmation email
const sendUserConfirmation = async (data) => {
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
    const response = await mail_1.default.send(msg);
    const messageId = response[0].headers["x-message-id"];
    await logEmail("user_confirmation", data.to, msg.subject, "sent");
    console.log(`✅ Confirmation email sent to ${data.to}`);
    console.log(`📬 Message ID: ${messageId}`);
    return { success: true, messageId: messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to send user confirmation email:", errorMessage);
    // Log SendGrid-specific error details
    if (error && typeof error === "object" && "response" in error) {
      console.error("SendGrid Error Details:", error.response?.body);
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
exports.sendUserConfirmation = sendUserConfirmation;
// Send admin notification email
const sendAdminNotification = async (data) => {
  try {
    console.log(`📤 Attempting to send admin notification...`);
    const template = await loadTemplate("adminNotification");
    const html = replacePlaceholders(template, {
      ...data,
      timestamp: new Date(data.timestamp).toLocaleString("en-NG", {
        timeZone: "UK/England",
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
    const response = await mail_1.default.send(msg);
    const messageId = response[0].headers["x-message-id"];
    await logEmail("admin_notification", ADMIN_EMAIL, msg.subject, "sent");
    console.log(`✅ Admin notification email sent`);
    console.log(`📬 Message ID: ${messageId}`);
    return { success: true, messageId: messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to send admin notification email:", errorMessage);
    if (error && typeof error === "object" && "response" in error) {
      console.error("SendGrid Error Details:", error.response?.body);
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
exports.sendAdminNotification = sendAdminNotification;
