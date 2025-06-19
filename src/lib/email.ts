import path from "node:path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export interface EmailOptions {
  /** @zod.email */
  to: string;
  subject: string;
  body: string;
  attachments?: string[];
}

export async function sendEmail({
  to,
  subject,
  body,
  attachments = [],
}: EmailOptions): Promise<void> {
  console.log("sendEmail", to, subject);
  const missing: string[] = [];
  if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!process.env.SMTP_USER) missing.push("SMTP_USER");
  if (!process.env.SMTP_PASS) missing.push("SMTP_PASS");
  if (!process.env.SMTP_FROM) missing.push("SMTP_FROM");
  if (missing.length) {
    throw new Error(`Missing SMTP configuration: ${missing.join(", ")}`);
  }

  let transporter: ReturnType<typeof nodemailer.createTransport>;
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (err) {
    console.error("Failed to create SMTP transporter", err);
    throw err;
  }

  const override = process.env.MOCK_EMAIL_TO;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: override || to,
    subject,
    text: body,
    attachments: attachments.map((p) => ({
      filename: path.basename(p),
      path: path.join(process.cwd(), "public", p.replace(/^\//, "")),
    })),
  });
  console.log("email sent", to);
}
