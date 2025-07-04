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
    let es: EventSource | null = null;
    let timer: NodeJS.Timeout | null = null;

    function start() {
      es = apiEventSource(url!);
      es.onmessage = handleMessage;
      es.onerror = () => {
        es?.close();
        es = null;
        if (!timer) {
          timer = setTimeout(() => {
            timer = null;
            start();
          }, 1000);
        }
      };
    }

    start();

    return () => {
      if (es) es.close();
      if (timer) clearTimeout(timer);
    };
  }, [url, handleMessage]);
}
