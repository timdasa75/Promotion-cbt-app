import { spawnSync } from "node:child_process";

export function runPythonScript(scriptPath, args = [], options = {}) {
  const configuredPython = String(process.env.PYTHON || "").trim();
  const candidates = configuredPython
    ? [{ command: configuredPython, prefixArgs: [] }]
    : [
        { command: "py", prefixArgs: ["-3"] },
        { command: "python", prefixArgs: [] },
        { command: "python3", prefixArgs: [] },
      ];

  let lastResult = null;
  for (const candidate of candidates) {
    const result = spawnSync(
      candidate.command,
      [...candidate.prefixArgs, scriptPath, ...args],
      options,
    );
    lastResult = result;
    if (!result.error && result.status === 0) {
      return result;
    }
    if (result.error && result.error.code === "ENOENT") {
      continue;
    }
    if (result.status === 9009 || String(result.stderr || result.stdout || "").includes("Python was not found")) {
      continue;
    }
    return result;
  }

  return lastResult;
}
