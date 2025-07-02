import "source-map-support/register";
import { createServer } from "node:http";
import next from "next";
import { type WebSocket, WebSocketServer } from "ws";
import { caseEvents } from "./src/lib/caseEvents";
import { migrationsReady } from "./src/lib/db";
import { jobEvents } from "./src/lib/jobEvents";
import { listJobs } from "./src/lib/jobScheduler";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  await migrationsReady();
  const server = createServer((req, res) => handle(req, res));
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", (socket: WebSocket) => {
    const send = (event: string, data: unknown) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ event, data }));
      }
    };

    const caseHandler = (data: unknown) => send("caseUpdate", data);
    const jobHandler = () => send("jobUpdate", listJobs());

    caseEvents.on("update", caseHandler);
    jobEvents.on("update", jobHandler);

    socket.on("close", () => {
      caseEvents.off("update", caseHandler);
      jobEvents.off("update", jobHandler);
    });
  });

  server.listen(port, () => {
    console.log(`Ready on http://localhost:${port}`);
  });
});
