import http from "node:http";
import type { AddressInfo } from "node:net";

export interface OpenAIStub {
  url: string;
  requests: Array<{ url: string | undefined; body: unknown }>;
  close: () => Promise<void>;
}

export type StubResponse =
  | string
  | Record<string, unknown>
  | ((req: { url: string | undefined; body: unknown; count: number }) =>
      | string
      | Record<string, unknown>);

export async function startOpenAIStub(
  responses: StubResponse | StubResponse[],
): Promise<OpenAIStub> {
  const requests: Array<{ url: string | undefined; body: unknown }> = [];
  const list = Array.isArray(responses) ? [...responses] : [responses];
  let count = 0;
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
    });
    req.on("end", () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
        requests.push({ url: req.url, body: parsed });
      } catch {
        parsed = body;
        requests.push({ url: req.url, body });
      }
      const handler =
        list.length > 1 ? (list.shift() as StubResponse) : list[0];
      const value =
        typeof handler === "function"
          ? handler({ url: req.url, body: parsed, count: count++ })
          : handler;
      const content =
        typeof value === "string" ? value : JSON.stringify(value ?? {});
      const withStream = parsed as { stream?: boolean };
      if (typeof parsed === "object" && parsed && withStream.stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.write(
          `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`,
        );
        res.write(
          `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`,
        );
        res.end();
      } else {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ choices: [{ message: { content } }] }));
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
