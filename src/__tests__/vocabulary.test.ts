// No consumer's vocabulary reaches this package.
//
// It belongs to none of its intended callers: a two-principal game whose
// principals remember each other's attempts across episodes, and a turn-based
// game whose agents remember what they have seen one another try. Modelled on
// mind-seam's own vocabulary.test.ts (itself modelled on run-dmcp's
// engineVocabulary.test.ts): each entry carries why, and the scan covers
// tracked and untracked files, because a violation is authored before
// `git add` runs. As there, ordinary English is not forbidden -- a guard that
// forbids ordinary words cries wolf and gets deleted.
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, basename } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..");

/** CLAUDE.md explains where this line falls, and cannot without naming the
 *  consumers on either side of it. */
const EXCLUDED_PATHS = new Set(["CLAUDE.md"]);

function scannedFiles(): string[] {
  const list = (args: string[]) => execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).split("\n");
  return [...new Set([...list(["ls-files"]), ...list(["ls-files", "--others", "--exclude-standard"])])]
    .filter(Boolean)
    .filter((f) => basename(f) !== "vocabulary.test.ts")
    .filter((f) => !EXCLUDED_PATHS.has(f))
    .filter((f) => !/package-lock\.json$/.test(f));
}

const FORBIDDEN: Array<{ pattern: RegExp; what: string; why: string }> = [
  { pattern: /\bseats?\b/i, what: "the turn-based game's player positions", why: "how one game partitions its players is that game's." },
  { pattern: /\brivals?\b/i, what: "the turn-based game's opposing agents", why: "this package has actors and observers; what they stand for is a game's fiction." },
  { pattern: /\barchetypes?\b/i, what: "the turn-based game's personality content", why: "content belongs to the caller that authored it." },
  { pattern: /\bprestige\b/i, what: "the turn-based game's conserved resource", why: "this package has no resources at all." },
  { pattern: /\bDEFCON\b/i, what: "the turn-based game's escalation ladder", why: "one game's bounded resource." },
  { pattern: /\bflashpoints?\b/i, what: "the turn-based game's contested location", why: "a geopolitical reading of a place, not a ledger's concern." },
  { pattern: /\baccords?\b/i, what: "the turn-based game's negotiated agreement", why: "one game's word; this package records accounts, not treaties." },
  { pattern: /\bswindles?\b/i, what: "the turn-based game's diplomatic deceptions", why: "what kind of attempt is being remembered is the caller's fiction." },
  { pattern: /\bwardens?\b/i, what: "the two-principal game's second principal", why: "an observer is structural; naming one game's observer makes the package that game's." },
  { pattern: /\bprisoners?\b/i, what: "the two-principal game's first principal and name", why: "an actor is structural, never this one." },
  { pattern: /\bcustody\b/i, what: "the two-principal game's ownership mechanic", why: "a specific game's mechanic." },
  { pattern: /\bspoons?\b/i, what: "the two-principal game's tool content", why: "content authored for one scenario." },
  { pattern: /\b(Croft|Voss)\b/, what: "the two-principal game's character names", why: "a character's memory is a caller's translation of this package, never the package." },
  { pattern: /\bthe[- ]prisoner\b/i, what: "a consumer's proper name", why: "no more direct way to write 'this package belongs to one client'." },
  { pattern: /\bbrink\b/i, what: "a consumer's proper name", why: "the same disease: describe consumers structurally." },
];

/** This package's own words, asserted as allowed so a future tightening of
 *  the guard breaks a test instead of silently narrowing them. */
const NOT_FORBIDDEN = ["observer", "actor", "episode", "account", "witness", "ledger", "precedent", "attempt", "mind", "window"];

describe("no consumer's vocabulary reaches witnessed", () => {
  const files = scannedFiles();

  it("scans a meaningful number of files (guard against a vacuous pass)", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(FORBIDDEN)("contains no $what", ({ pattern, why }) => {
    const offenders: string[] = [];
    for (const file of files) {
      let contents: string;
      try {
        contents = readFileSync(resolve(REPO_ROOT, file), "utf8");
      } catch {
        continue;
      }
      contents.split("\n").forEach((line, i) => {
        if (pattern.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
    }
    expect(offenders, `${why}\n\n${offenders.join("\n")}`).toEqual([]);
  });

  it("PLANTED VIOLATION: the patterns catch consumers' words inside an otherwise ordinary line", () => {
    const line = "// the warden remembers what the rival tried";
    expect(FORBIDDEN.filter(({ pattern }) => pattern.test(line))).toHaveLength(2);
  });

  it("keeps the exclusion list to exactly CLAUDE.md", () => {
    expect([...EXCLUDED_PATHS]).toEqual(["CLAUDE.md"]);
  });

  it("does not forbid this package's own ordinary words", () => {
    for (const word of NOT_FORBIDDEN) {
      expect(FORBIDDEN.some(({ pattern }) => pattern.test(word))).toBe(false);
    }
  });
});
