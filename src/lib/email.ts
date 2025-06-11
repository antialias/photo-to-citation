import path from "node:path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export interface EmailOptions {
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
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
      : undefined,
  });
  const override = process.env.MOCK_EMAIL_TO;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: override || to,
    subject,
    text: body,
    attachments: attachments.map((p) => ({
      filename: path.basename(p),
      path: path.join(process.cwd(), "public", p.replace(/^\//, "")),
    })),
  });
}
