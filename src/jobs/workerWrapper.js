const { workerData, parentPort } = require("node:worker_threads");
require("ts-node/register");
require(workerData.path);
