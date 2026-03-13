#!/usr/bin/env node

const { spawn } = require("node:child_process");
const path = require("node:path");
const { createRequire } = require("node:module");

const appDir = path.resolve(__dirname, "..");
const requireFromApp = createRequire(path.join(appDir, "package.json"));

const resolveElectronBuilderCli = () =>
  requireFromApp.resolve("electron-builder/cli.js");

const runElectronBuilder = (args) => {
  const child = spawn(process.execPath, [resolveElectronBuilderCli(), ...args], {
    cwd: appDir,
    env: process.env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
};

if (require.main === module) {
  runElectronBuilder(process.argv.slice(2));
}

module.exports = {
  appDir,
  resolveElectronBuilderCli,
  runElectronBuilder,
};
