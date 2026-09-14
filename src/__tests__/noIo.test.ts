// No I/O outside the tests. A ledger is handed in and handed back; where it
// is kept is the caller's decision (CLAUDE.md, "No storage, no network").
// Scans every non-test source file for the tokens a read or write would need.
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(__dirname, "..");

const FORBIDDEN = ["fetch(", "node:fs", "node:net", "node:http", "node:child_process", "process.env", "require(", "XMLHttpRequest", "localStorage"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return path.endsWith(".ts") && !path.endsWith(".test.ts") ? [path] : [];
  });
}

export function ioTokensIn(text: string): string[] {
  return FORBIDDEN.filter((token) => text.includes(token));
}

describe("no I/O in the package's own source", () => {
  it("scans at least the ledger", () => {
    expect(sourceFiles(SRC).some((f) => f.endsWith("ledger.ts"))).toBe(true);
  });

  it("contains no read, write or network token", () => {
    const offenders = sourceFiles(SRC).flatMap((f) => ioTokensIn(readFileSync(f, "utf8")).map((t) => `${f}: ${t}`));
    expect(offenders).toEqual([]);
  });

  it("PLANTED VIOLATION: the scan catches a file read", () => {
    expect(ioTokensIn(`${readFileSync(join(SRC, "ledger.ts"), "utf8")}\nimport { readFileSync } from "node:fs";`)).toContain("node:fs");
  });
});
