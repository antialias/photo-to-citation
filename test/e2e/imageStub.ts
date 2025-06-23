import http from "node:http";
import type { AddressInfo } from "node:net";
import sharp from "sharp";

export interface ImageStub {
  url: string;
  requests: Array<{ url: string | undefined; body: unknown }>;
  close: () => Promise<void>;
}

export async function startImageStub(): Promise<ImageStub> {
  const requests: Array<{ url: string | undefined; body: unknown }> = [];
  const img = await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
  let stubUrl = "";
  const server = http.createServer((req, res) => {
    if (req.url?.startsWith("/img/")) {
      res.setHeader("Content-Type", "image/png");
      res.end(img);
      return;
    }
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
      const index = requests.length;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ data: [{ url: `${stubUrl}/img/${index}.png` }] }),
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  stubUrl = `http://127.0.0.1:${port}`;
  return {
    url: stubUrl,
    requests,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}
