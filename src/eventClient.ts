import { subscribe as wsSubscribe } from "./webSocketClient";

export type Unsubscribe = () => void;

export function subscribe(
  event: string,
  cb: (data: unknown) => void,
): Unsubscribe | undefined {
  return wsSubscribe(event, cb);
}
