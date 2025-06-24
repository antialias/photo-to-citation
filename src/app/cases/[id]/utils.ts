import type { Case, SentEmail } from "@/lib/caseStore";

export function buildThreads(c: Case): SentEmail[] {
  const mails = c.sentEmails ?? [];
  const threads = new Map<string, SentEmail>();
  for (const mail of mails) {
    let root = mail;
    while (root.replyTo) {
      const parent = mails.find((m) => m.sentAt === root.replyTo);
      if (!parent) break;
      root = parent;
    }
    const current = threads.get(root.sentAt);
    if (!current || new Date(mail.sentAt) > new Date(current.sentAt)) {
      threads.set(root.sentAt, mail);
    }
  }
  return Array.from(threads.values()).sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}

export function baseName(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1];
}
