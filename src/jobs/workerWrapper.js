const { workerData, parentPort } = require("node:worker_threads");
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs" },
});
require(workerData.path);
