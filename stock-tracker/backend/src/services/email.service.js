const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const isConfigured = Boolean(process.env.SMTP_HOST);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

const sendPasswordResetEmail = async (to, resetUrl) => {
  if (!transporter) {
    logger.warn(
      `SMTP not configured — password reset link for ${to}: ${resetUrl}`,
      { tag: "EMAIL" },
    );
    return;
  }

  await transporter.sendMail({
    from:
      process.env.EMAIL_FROM || '"Stocklytics" <no-reply@stocklytics.local>',
    to,
    subject: "Reset your Stocklytics password",
    text: `Someone requested a password reset for your Stocklytics account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
    html: `
      <p>Someone requested a password reset for your Stocklytics account.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  logger.info(`Password reset email sent to ${to}`, { tag: "EMAIL" });
};

module.exports = { sendPasswordResetEmail, isConfigured };
