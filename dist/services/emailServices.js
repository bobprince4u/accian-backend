"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminNotification = exports.sendUserConfirmation = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const { connect } = require("http2");
const database_1 = require("../config/database");
// Create email transporter
const transporter = nodemailer_1.default.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20000,
});
// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});
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
    result = result.replace(regex, data[key] || "");
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to log email:", errorMessage);
  }
};
// Send user confirmation email
const sendUserConfirmation = async (data) => {
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
    const info = await transporter.sendMail(mailOptions);
    await logEmail("user_confirmation", data.to, mailOptions.subject, "sent");
    console.log(`✅ Confirmation email sent to ${data.to}`);
    console.log(`Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
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
exports.sendUserConfirmation = sendUserConfirmation;
// Send admin notification email
const sendAdminNotification = async (data) => {
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
    const info = await transporter.sendMail(mailOptions);
    await logEmail(
      "admin_notification",
      process.env.ADMIN_EMAIL,
      mailOptions.subject,
      "sent"
    );
    console.log(`✅ Admin notification email sent`);
    console.log(`Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
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
exports.sendAdminNotification = sendAdminNotification;
