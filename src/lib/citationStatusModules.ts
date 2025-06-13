export interface CitationStatus {
  citation: string;
  status: string;
  /** @zod.date */
  updatedAt: string;
}

export interface CitationStatusModule {
  id: string;
  /**
   * Lookup a citation in the county court system.
   *
   * @param state - Two letter state code.
   * @param county - Name of the county.
   * @param citation - Citation or ticket number.
   */
  lookupCitationStatus: (
    state: string,
    county: string,
    citation: string,
  ) => Promise<CitationStatus | null>;
}

/**
 * Built-in modules keyed by unique id.
 */
export const citationStatusModules: Record<string, CitationStatusModule> = {
  mock: {
    id: "mock",
    async lookupCitationStatus(state, county, citation) {
      return {
        citation,
        status: `Citation ${citation} for ${county} County, ${state} is pending`,
        updatedAt: new Date().toISOString(),
      };
    },
  },
};
