declare module "drizzle-orm/sqlite-core/table" {
  export * from "drizzle-orm/sqlite-core";
}
declare module "drizzle-orm/sqlite-core" {
  // biome-ignore lint/suspicious/noExplicitAny: external library types
  export const sqliteTable: any;
  // biome-ignore lint/suspicious/noExplicitAny: external library types
  export const integer: any;
  // biome-ignore lint/suspicious/noExplicitAny: external library types
  export const real: any;
  // biome-ignore lint/suspicious/noExplicitAny: external library types
  export const text: any;
  // biome-ignore lint/suspicious/noExplicitAny: external library types
  export const primaryKey: any;
  // biome-ignore lint/suspicious/noExplicitAny: external library types
  export type AnySQLiteColumn = any;
}
