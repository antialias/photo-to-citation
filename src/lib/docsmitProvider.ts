import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import FormData from "form-data";
import type {
  MailingAddress,
  SnailMailOptions,
  SnailMailProvider,
  SnailMailStatus,
} from "./snailMail";
import { addSentMail } from "./snailMailStore";

dotenv.config();

let cachedToken: { token: string; fetchedAt: number } | null = null;

function hashPassword(pw: string): string {
  return crypto.createHash("sha512").update(pw).digest("hex");
}

async function getToken(
  base: string,
  email: string,
  password: string,
  software: string,
): Promise<string> {
  const res = await fetch(`${base}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: hashPassword(password),
      softwareID: software,
    }),
  });
  if (!res.ok) throw new Error(`Docsmit auth failed ${res.status}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function ensureToken(
  base: string,
  email: string,
  password: string,
  software: string,
): Promise<string> {
  if (!cachedToken || Date.now() - cachedToken.fetchedAt > 55 * 60 * 1000) {
    const token = await getToken(base, email, password, software);
    cachedToken = { token, fetchedAt: Date.now() };
  }
  return cachedToken.token;
}

function toAddress(a: MailingAddress): Record<string, string> {
  return {
    firstName: a.name?.split(" ")[0] ?? "",
    lastName: a.name?.split(" ").slice(1).join(" ") ?? "",
    organization: a.name?.includes(" ") ? undefined : a.name,
    address1: a.address1,
    address2: a.address2 ?? "",
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    sendType: "First Class",
    envelope: "#10",
  } as Record<string, string>;
}

async function fetchWithToken(
  base: string,
  token: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const headers = {
    ...(init.headers || {}),
    Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
  };
  return fetch(`${base}${url}`, { ...init, headers });
}

async function docsmitRequest(
  base: string,
  email: string,
  password: string,
  software: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  let token = await ensureToken(base, email, password, software);
  let res = await fetchWithToken(base, token, url, init);
  if (res.status === 401) {
    cachedToken = null;
    token = await ensureToken(base, email, password, software);
    res = await fetchWithToken(base, token, url, init);
  }
  return res;
}

const provider: SnailMailProvider = {
  id: "docsmit",
  label: "Docsmit",
  docs: "https://docs.docsmit.com",
  async send(opts: SnailMailOptions): Promise<SnailMailStatus> {
    const base =
      process.env.DOCSMIT_BASE_URL || "https://secure.tracksmit.com/api/v1";
    const email = process.env.DOCSMIT_EMAIL || "";
    const password = process.env.DOCSMIT_PASSWORD || "";
    const softwareID = process.env.DOCSMIT_SOFTWARE_ID || "";
    if (!email || !password || !softwareID)
      throw new Error("Docsmit env vars not set");
    const createBody = {
      title: opts.subject || "",
      physicalParties: [toAddress(opts.to)],
      rtnName: opts.from.name,
      rtnAddress1: opts.from.address1,
      rtnAddress2: opts.from.address2,
      rtnCity: opts.from.city,
      rtnState: opts.from.state,
      rtnZip: opts.from.postalCode,
    };
    let res = await docsmitRequest(
      base,
      email,
      password,
      softwareID,
      "/messages/new",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      },
    );
    const data = (await res.json()) as { messageID: string };
    const messageID = data.messageID;

    const form = new FormData();
    const filePath = path.resolve(opts.contents);
    form.append("file", fs.createReadStream(filePath));
    res = await docsmitRequest(
      base,
      email,
      password,
      softwareID,
      `/messages/${messageID}/upload`,
      {
        method: "POST",
        body: form as unknown as BodyInit,
      },
    );

    res = await docsmitRequest(
      base,
      email,
      password,
      softwareID,
      `/messages/${messageID}/send`,
      {
        method: "POST",
      },
    );
    let shortfall: number | undefined;
    if (res.status === 402) {
      shortfall = (await res.json()).shortfall as number | undefined;
      console.log("Docsmit payment required", { shortfall });
    }
    const status: SnailMailStatus = {
      id: messageID,
      status: res.status === 201 ? "queued" : "error",
      shortfall,
    };
    addSentMail({
      id: crypto.randomUUID(),
      providerId: provider.id,
      providerMessageId: messageID,
      to: opts.to,
      from: opts.from,
      subject: opts.subject,
      contents: opts.contents,
      status: status.status,
      sentAt: new Date().toISOString(),
    });
    return status;
  },
};

export default provider;
