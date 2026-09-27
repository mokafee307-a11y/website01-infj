import { spawn } from "node:child_process";

// Node's timeout works on both macOS and Linux without GNU coreutils.
const duration = process.env.SITES_BUILD_TIMEOUT ?? "3m";
const match = /^(\d+)(ms|s|m)?$/.exec(duration);
if (!match || !process.argv[2]) {
  throw new Error("Expected a build executable and a timeout such as 180s or 3m.");
}
const milliseconds = Number(match[1]) * ({ ms: 1, s: 1000, m: 60000 }[match[2] ?? "s"]);
if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) {
  throw new Error("Build timeout must be positive.");
}
const child = spawn(process.argv[2], ["build"], {
  stdio: "inherit",
  timeout: milliseconds,
  killSignal: "SIGKILL",
});
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code, signal) => {
  if (signal) console.error(`Build terminated (${signal}); no deployment artifact will be published.`);
  process.exitCode = code ?? 1;
});
