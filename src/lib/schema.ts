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
  public: integer("public", { mode: "boolean" }).notNull().default(false),
  sessionId: text("session_id"),
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
    context: text("context"),
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
  bio: text("bio"),
  social: text("social"),
  profileStatus: text("profile_status").notNull().default("under_review"),
  profileReason: text("profile_reason"),
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

export const caseMembers = sqliteTable(
  "case_members",
  {
    caseId: text("case_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
  },
  (t) => ({
    pk: primaryKey(t.caseId, t.userId),
  }),
);
