import path from "node:path";
import nodemailer from "nodemailer";
import { config } from "./config";
import { addSentEmail } from "./emailStore";

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

  const finalTo = config.MOCK_EMAIL_TO || to;
  if (config.EMAIL_FILE) {
    addSentEmail({
      to: finalTo,
      subject,
      body,
      attachments,
      sentAt: new Date().toISOString(),
    });
    console.log("mock email stored", finalTo);
    return;
  }

  const missing: string[] = [];
  if (!config.SMTP_HOST) missing.push("SMTP_HOST");
  if (!config.SMTP_USER) missing.push("SMTP_USER");
  if (!config.SMTP_PASS) missing.push("SMTP_PASS");
  if (!config.SMTP_FROM) missing.push("SMTP_FROM");
  if (missing.length) {
    throw new Error(`Missing SMTP configuration: ${missing.join(", ")}`);
  }

  let transporter: ReturnType<typeof nodemailer.createTransport>;
  try {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT ? Number(config.SMTP_PORT) : 587,
      secure: config.SMTP_SECURE === true,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  } catch (err) {
    console.error("Failed to create SMTP transporter", err);
    throw err;
  }

  await transporter.sendMail({
    from: config.SMTP_FROM,
    to: finalTo,
    subject,
    text: body,
    attachments: attachments.map((p) => ({
      filename: path.basename(p),
      path: path.join(process.cwd(), "public", p.replace(/^\//, "")),
    })),
  });
  console.log("email sent", to);
}
