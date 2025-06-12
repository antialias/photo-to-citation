import http from "node:http";
import type { AddressInfo } from "node:net";

export interface OpenAIStub {
  url: string;
  requests: Array<{ url: string | undefined; body: unknown }>;
  close: () => Promise<void>;
}

export async function startOpenAIStub(
  response: Record<string, string>,
): Promise<OpenAIStub> {
  const requests: Array<{ url: string | undefined; body: unknown }> = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
    });
    req.on("end", () => {
      try {
        requests.push({ url: req.url, body: JSON.parse(body) });
      } catch {
        requests.push({ url: req.url, body });
      }
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(response) } }],
        }),
      );
    });
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://localhost:${port}`,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
