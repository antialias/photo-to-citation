import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
});

export const casePhotos = sqliteTable(
  "case_photos",
  {
    caseId: text("case_id").notNull(),
    url: text("url").notNull(),
    takenAt: text("taken_at"),
    gpsLat: real("gps_lat"),
    gpsLon: real("gps_lon"),
  },
  (photos) => ({
    caseIdx: primaryKey(photos.caseId, photos.url),
  }),
);

export const casePhotoAnalysis = sqliteTable(
  "case_photo_analysis",
  {
    caseId: text("case_id").notNull(),
    url: text("url").notNull(),
    representationScore: real("representation_score").notNull(),
    highlights: text("highlights"),
    violation: integer("violation"),
    paperwork: integer("paperwork"),
    paperworkText: text("paperwork_text"),
    paperworkInfo: text("paperwork_info"),
  },
  (t) => ({
    pk: primaryKey(t.caseId, t.url),
  }),
);
