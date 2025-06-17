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

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  role: text("role").notNull().default("user"),
});

export const casbinRules = sqliteTable("casbin_rules", {
  ptype: text("ptype").notNull(),
  v0: text("v0"),
  v1: text("v1"),
  v2: text("v2"),
  v3: text("v3"),
  v4: text("v4"),
  v5: text("v5"),
});
