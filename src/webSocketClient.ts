let ws: WebSocket | null = null;
const listeners = new Map<string, Set<(data: unknown) => void>>();

function open() {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const list = listeners.get(msg.event);
        if (list) {
          for (const cb of list) {
            cb(msg.data);
          }
        }
      } catch {
        // ignore parse errors
      }
    };
    ws.onclose = () => {
      ws = null;
    };
  }
}

export function subscribe(event: string, cb: (data: unknown) => void) {
  if (typeof WebSocket === "undefined" || process.env.VITEST) {
    return undefined;
  }
  open();
  const list = listeners.get(event) ?? new Set();
  list.add(cb);
  listeners.set(event, list);
  return () => {
    list.delete(cb);
    if (list.size === 0) listeners.delete(event);
    if (listeners.size === 0 && ws) {
      ws.close();
      ws = null;
    }
  };
}
