import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getConfig } from "./config";
import type {
  SnailMailOptions,
  SnailMailProvider,
  SnailMailStatus,
} from "./snailMail";
import { addSentMail } from "./snailMailStore";

const provider: SnailMailProvider = {
  id: "file",
  label: "File System Provider",
  docs: "Save snail mail PDFs and a manifest locally.",
  async send(
    opts: SnailMailOptions,
    config?: Record<string, unknown>,
  ): Promise<SnailMailStatus> {
    const env = getConfig();
    const dir =
      (config?.dir as string) ||
      env.SNAIL_MAIL_OUT_DIR ||
      path.join(process.cwd(), "data", "snailmail_out");
    fs.mkdirSync(dir, { recursive: true });
    const id = crypto.randomUUID();
    const pdfPath = path.join(dir, `${id}.pdf`);
    fs.copyFileSync(path.resolve(opts.contents), pdfPath);
    const manifest = {
      id,
      to: opts.to,
      from: opts.from,
      subject: opts.subject,
      contents: path.basename(pdfPath),
      sentAt: new Date().toISOString(),
    };
    fs.writeFileSync(
      path.join(dir, `${id}.json`),
      JSON.stringify({ ...manifest, providerId: provider.id }, null, 2),
    );
    addSentMail({
      id,
      providerId: provider.id,
      providerMessageId: id,
      to: opts.to,
      from: opts.from,
      subject: opts.subject,
      contents: pdfPath,
      status: "saved",
      sentAt: manifest.sentAt,
    });
    return { id, status: "saved" };
  },
};

export default provider;
