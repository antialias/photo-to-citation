import type { TestServer } from "./startServer";

declare global {
  var server: TestServer;
}
