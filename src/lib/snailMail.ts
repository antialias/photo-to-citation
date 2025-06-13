import { runJob } from "./jobScheduler";
import "./zod-setup";

export interface MailingAddress {
  name?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface SnailMailOptions {
  to: MailingAddress;
  from: MailingAddress;
  subject?: string;
  /** Path to a PDF or other file to mail */
  contents: string;
}

export interface SnailMailProvider {
  id: string;
  label: string;
  /** Describe configuration required for this provider */
  docs: string;
  send: (
    opts: SnailMailOptions,
    config?: Record<string, unknown>,
  ) => Promise<void>;
}

export const snailMailProviders: Record<string, SnailMailProvider> = {
  mock: {
    id: "mock",
    label: "Mock Snail Mail Provider",
    docs: "A no-op provider used during development.",
    async send(opts) {
      console.log("mock snail mail", opts);
    },
  },
};

export async function sendSnailMail(
  providerId: string,
  opts: SnailMailOptions,
  config?: Record<string, unknown>,
): Promise<void> {
  const provider = snailMailProviders[providerId];
  if (!provider) throw new Error(`Unknown provider ${providerId}`);
  await provider.send(opts, config);
}

export function sendSnailMailInBackground(
  providerId: string,
  opts: SnailMailOptions,
  config?: Record<string, unknown>,
): void {
  runJob("sendSnailMail", { providerId, opts, config });
}
