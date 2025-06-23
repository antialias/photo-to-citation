import http from "node:http";
import type { AddressInfo } from "node:net";

export interface OpenAIImageStub {
  url: string;
  requests: Array<{ url: string | undefined; body: unknown }>;
  close(): Promise<void>;
}

export async function startOpenAIImageStub(): Promise<OpenAIImageStub> {
  const requests: Array<{ url: string | undefined; body: unknown }> = [];
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAgMBApHgTKAAAAAASUVORK5CYII=",
    "base64",
  );
  const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/v1/images/generations") {
      let body = "";
      req.on("data", (c) => {
        body += c;
      });
      req.on("end", () => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        requests.push({ url: req.url, body: parsed });
        const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/img.png`;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ data: [{ url }] }));
      });
    } else if (req.url === "/img.png") {
      res.setHeader("Content-Type", "image/png");
      res.end(png);
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((r) => server.close(() => r())),
  };
}
