export interface ReportModule {
  id: string;
  authorityName: string;
  /** @zod.email */
  authorityEmail: string;
}

export const reportModules: Record<string, ReportModule> = {
  "oak-park": {
    id: "oak-park",
    authorityName: "Oak Park Police Department",
    authorityEmail: "police@oak-park.us",
  },
};
