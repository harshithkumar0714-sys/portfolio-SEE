import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const processes = [
  spawn(process.execPath, [join(root, "node_modules", "tsx", "dist", "cli.mjs"), "watch", "src/server.ts"], {
    cwd: join(root, "backend"),
    stdio: "inherit",
  }),
  spawn(process.execPath, [join(root, "node_modules", "vite", "bin", "vite.js"), "--host", "0.0.0.0"], {
    cwd: join(root, "frontend"),
    stdio: "inherit",
  }),
];

let stopping = false;
function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of processes) if (!child.killed) child.kill(signal);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
for (const child of processes) {
  child.on("error", (error) => {
    console.error("Unable to start a development process:", error);
    stop();
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (!stopping) {
      process.exitCode = code ?? 1;
      stop();
    }
  });
}
