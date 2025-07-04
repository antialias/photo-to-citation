"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  type UnleashClient as Unleash,
  UnleashClient,
} from "unleash-proxy-client";

const UnleashContext = createContext<Unleash | null>(null);

export function UnleashProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<Unleash | null>(null);
  if (clientRef.current === null) {
    const url = process.env.NEXT_PUBLIC_UNLEASH_PROXY_URL;
    const key = process.env.NEXT_PUBLIC_UNLEASH_CLIENT_KEY;
    if (url && key) {
      const client = new UnleashClient({
        url,
        clientKey: key,
        appName: "photo-to-citation",
      });
      client.start();
      clientRef.current = client;
    } else {
      clientRef.current = null;
    }
  }
  return (
    <UnleashContext.Provider value={clientRef.current}>
      {children}
    </UnleashContext.Provider>
  );
}

export function useUnleash(): Pick<Unleash, "isEnabled"> {
  const client = useContext(UnleashContext);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!client) return;
    const handler = () => setTick((n) => n + 1);
    client.on("update", handler);
    return () => {
      client.off("update", handler);
    };
  }, [client]);
  return (
    client ??
    ({
      isEnabled() {
        return false;
      },
    } as Pick<Unleash, "isEnabled">)
  );
}
