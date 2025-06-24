declare module "better-sqlite3" {
  interface Statement<T = unknown> {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): T;
    all(...params: unknown[]): T[];
  }

  interface DB {
    prepare<T = unknown>(sql: string): Statement<T>;
    exec(sql: string): this;
    close(): void;
    // biome-ignore lint/suspicious/noExplicitAny: upstream library lacks types
    transaction<T extends (...args: any[]) => any>(fn: T): T;
  }

  interface DatabaseConstructor {
    new (path: string): DB;
    (path: string): DB;
    prototype: DB;
  }

  const Database: DatabaseConstructor;

  namespace Database {
    export type Database = DB;
    export type Statement<T = unknown> = import("better-sqlite3").Statement<T>;
  }

  export = Database;
}
