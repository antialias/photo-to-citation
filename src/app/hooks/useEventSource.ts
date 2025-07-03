import { apiEventSource } from "@/apiClient";
import { useCallback, useEffect } from "react";

export default function useEventSource<T>(
  url: string | null,
  onData: (data: T) => void,
) {
  const handleMessage = useCallback(
    (e: MessageEvent<string>) => {
      try {
        onData(JSON.parse(e.data) as T);
      } catch {
        // ignore invalid JSON
      }
    },
    [onData],
  );

  useEffect(() => {
    if (!url) return;
    const es = apiEventSource(url);
    es.onmessage = handleMessage;
    return () => es.close();
  }, [url, handleMessage]);
}
