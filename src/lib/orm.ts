import { drizzle } from "drizzle-orm/better-sqlite3";
import { db } from "./db";
import * as schema from "./schema";

export const orm = drizzle(db, { schema });
