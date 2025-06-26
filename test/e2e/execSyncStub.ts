import * as cp from "node:child_process";

(cp as unknown as { execSync: () => Buffer }).execSync = () => Buffer.from("");
