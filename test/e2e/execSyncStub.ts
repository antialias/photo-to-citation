const cp = require("node:child_process");
cp.execSync = () => Buffer.from("");
