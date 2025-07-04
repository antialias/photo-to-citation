import { apiEventSource } from "@/apiClient";
import { useCallback, useEffect, useRef } from "react";

export default function useEventSource<T>(
  url: string | null,
  onData: (data: T) => void,
) {
  const cbRef = useRef(onData);

  useEffect(() => {
    cbRef.current = onData;
  }, [onData]);

  const handleMessage = useCallback((e: MessageEvent<string>) => {
    try {
      cbRef.current(JSON.parse(e.data) as T);
    } catch {
      // ignore invalid JSON
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleMessage uses a ref
  useEffect(() => {
    if (!url) return;
    const es = apiEventSource(url);
    es.onmessage = handleMessage;
    return () => es.close();
  }, [url]);
}
