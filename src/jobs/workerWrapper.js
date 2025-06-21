/* eslint-disable @typescript-eslint/no-require-imports */
const { workerData } = require("node:worker_threads");
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs" },
});
require("tsconfig-paths/register");
require(workerData.path);
