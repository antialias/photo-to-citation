export interface OwnershipModule {
  id: string;
  state: string;
  address: string;
  fee: number;
  requiresCheck: boolean;
}

export const ownershipModules: Record<string, OwnershipModule> = {
  il: {
    id: "il",
    state: "Illinois",
    address:
      "Driver Records Unit\n2701 S. Dirksen Pkwy.\nSpringfield, IL 62723",
    fee: 12,
    requiresCheck: true,
  },
  ca: {
    id: "ca",
    state: "California",
    address:
      "DMV Vehicle History Section\nP.O. Box 944247\nSacramento, CA 94244-2470",
    fee: 5,
    requiresCheck: true,
  },
};
