import docsmitProvider from "./docsmitProvider";
import fileProvider from "./fileSnailMailProvider";
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

export interface SnailMailStatus {
  id: string;
  status: string;
  trackingId?: string;
  shortfall?: number;
}

export interface SnailMailProvider {
  id: string;
  label: string;
  /** Describe configuration required for this provider */
  docs: string;
  send: (
    opts: SnailMailOptions,
    config?: Record<string, unknown>,
  ) => Promise<SnailMailStatus>;
  getStatus?: (
    id: string,
    config?: Record<string, unknown>,
  ) => Promise<SnailMailStatus | null>;
  poll?: (config?: Record<string, unknown>) => Promise<void>;
  webhooks?: Record<string, (payload: unknown) => Promise<void>>;
}

export const snailMailProviders: Record<string, SnailMailProvider> = {
  mock: {
    id: "mock",
    label: "Mock Snail Mail Provider",
    docs: "A no-op provider used during development.",
    async send(opts) {
      console.log("mock snail mail", opts);
      return {
        id: `mock-${Date.now()}`,
        status: "queued",
      };
    },
  },
  docsmit: docsmitProvider,
  file: fileProvider,
};

export async function sendSnailMail(
  providerId: string,
  opts: SnailMailOptions,
  config?: Record<string, unknown>,
): Promise<SnailMailStatus> {
  const provider = snailMailProviders[providerId];
  if (!provider) throw new Error(`Unknown provider ${providerId}`);
  return provider.send(opts, config);
}

export function sendSnailMailInBackground(
  providerId: string,
  opts: SnailMailOptions,
  config?: Record<string, unknown>,
): void {
  runJob("sendSnailMail", { providerId, opts, config });
}

export async function pollAllProviders(): Promise<void> {
  for (const provider of Object.values(snailMailProviders)) {
    if (provider.poll) {
      await provider.poll();
    }
  }
}
