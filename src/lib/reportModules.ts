export interface ReportModule {
  id: string;
  authorityName: string;
  /** @zod.email */
  authorityEmail: string;
  authorityAddress?: string;
}

export const reportModules: Record<string, ReportModule> = {
  "oak-park": {
    id: "oak-park",
    authorityName: "Oak Park Police Department",
    authorityEmail: "police@oak-park.us",
    authorityAddress: "123 Madison St\nOak Park, IL 60302",
  },
};
