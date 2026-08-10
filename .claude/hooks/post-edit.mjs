#!/usr/bin/env node
/**
 * PostToolUse hook — cross-platform (Windows / macOS / Linux).
 * Runs prettier + eslint on the file Claude just wrote or edited.
 *
 * Receives the hook payload as JSON on stdin. Never fails the tool call:
 * always exits 0 so a formatting problem can't block Claude's work.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const FORMAT_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".css", ".scss", ".md",
]);
const LINT_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

// Skip anything we shouldn't touch.
const SKIP_DIRS = ["node_modules", ".next", "dist", "build", ".turbo"];

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function run(cmd, args) {
  // shell:true is required on Windows for npx to resolve.
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: 60_000,
  });
  return res;
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readStdin() || "{}");
  } catch {
    process.exit(0);
  }

  const filePath =
    payload?.tool_input?.file_path ?? payload?.tool_input?.path ?? "";

  if (!filePath || !existsSync(filePath)) process.exit(0);
  if (SKIP_DIRS.some((d) => filePath.includes(`${path.sep}${d}${path.sep}`))) {
    process.exit(0);
  }

  const ext = path.extname(filePath).toLowerCase();

  if (FORMAT_EXT.has(ext)) {
    run("npx", ["--no-install", "prettier", "--write", filePath]);
  }

  if (LINT_EXT.has(ext)) {
    const res = run("npx", ["--no-install", "eslint", "--fix", filePath]);
    const out = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();
    // Surface remaining lint errors back to Claude so it can fix them.
    if (res.status !== 0 && out) {
      console.error(out.split("\n").slice(0, 25).join("\n"));
    }
  }

  process.exit(0);
}

main();
