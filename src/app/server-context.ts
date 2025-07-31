import type { Session } from "next-auth";
import { createContext, use } from "react";

function createServerContext<T>(defaultValue: T) {
  const ctx = createContext<T>(defaultValue);
  return Object.assign(ctx, {
    read(): T {
      try {
        // @ts-ignore React 19 server hook
        return use(ctx);
      } catch {
        return (
          (ctx as unknown as { _currentValue?: T })._currentValue ??
          defaultValue
        );
      }
    },
  });
}

export const SessionContext = createServerContext<Session | null>(null);
export const LanguageContext = createServerContext<string>("en");
