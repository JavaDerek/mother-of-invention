import { describe, it, expect } from "vitest";
import { emptyLedger, beginEpisode, witness, seenBefore, parseLedger, type Ledger } from "./index.js";

function ledgerWithTwoEpisodes(): Ledger {
  let ledger = emptyLedger();
  ledger = beginEpisode(ledger, "e1");
  ledger = witness(ledger, { episode: "e1", actor: "A", observer: "B", text: "A works at the window." });
  ledger = witness(ledger, { episode: "e1", actor: "A", observer: "B", text: "A works at the window." });
  ledger = witness(ledger, { episode: "e1", actor: "A", observer: "B", text: "A strikes the pail." });
  ledger = beginEpisode(ledger, "e2");
  ledger = witness(ledger, { episode: "e2", actor: "A", observer: "B", text: "A works at the window." });
  ledger = witness(ledger, { episode: "e2", actor: "B", observer: "A", text: "B looks the window over." });
  return ledger;
}

describe("the ledger is plain, immutable data", () => {
  it("starts empty", () => {
    expect(emptyLedger()).toEqual({ version: 1, episodes: [], accounts: [] });
  });

  it("never mutates the ledger it is given", () => {
    const before = emptyLedger();
    const after = beginEpisode(before, "e1");
    expect(before.episodes).toEqual([]);
    expect(after.episodes).toEqual(["e1"]);
  });

  it("round-trips through JSON exactly", () => {
    const ledger = ledgerWithTwoEpisodes();
    expect(parseLedger(JSON.parse(JSON.stringify(ledger)))).toEqual(ledger);
  });
});

describe("episodes have one order, declared by the caller", () => {
  it("refuses to begin the same episode twice", () => {
    const ledger = beginEpisode(emptyLedger(), "e1");
    expect(() => beginEpisode(ledger, "e1")).toThrow(/e1/);
  });

  it("refuses an account for an episode that was never begun", () => {
    expect(() => witness(emptyLedger(), { episode: "ghost", actor: "A", observer: "B", text: "x" })).toThrow(/ghost/);
  });

  it("refuses an empty text, actor or observer", () => {
    const ledger = beginEpisode(emptyLedger(), "e1");
    expect(() => witness(ledger, { episode: "e1", actor: "A", observer: "B", text: "" })).toThrow(/text/);
    expect(() => witness(ledger, { episode: "e1", actor: "", observer: "B", text: "x" })).toThrow(/actor/);
    expect(() => witness(ledger, { episode: "e1", actor: "A", observer: "", text: "x" })).toThrow(/observer/);
  });
});

describe("seenBefore: what one observer has witnessed, in episodes before this one", () => {
  it("counts exact repeats, and reports how many earlier episodes each appeared in", () => {
    const ledger = beginEpisode(ledgerWithTwoEpisodes(), "e3");
    expect(seenBefore(ledger, { observer: "B", actor: "A", episode: "e3" })).toEqual([
      { text: "A works at the window.", times: 3, episodes: 2, lastEpisode: "e2" },
      { text: "A strikes the pail.", times: 1, episodes: 1, lastEpisode: "e1" },
    ]);
  });

  it("excludes the current episode and every later one", () => {
    const ledger = ledgerWithTwoEpisodes();
    expect(seenBefore(ledger, { observer: "B", actor: "A", episode: "e2" })).toEqual([
      { text: "A works at the window.", times: 2, episodes: 1, lastEpisode: "e1" },
      { text: "A strikes the pail.", times: 1, episodes: 1, lastEpisode: "e1" },
    ]);
    expect(seenBefore(ledger, { observer: "B", actor: "A", episode: "e1" })).toEqual([]);
  });

  it("orders by most recent episode first, then by how often", () => {
    let ledger = ledgerWithTwoEpisodes();
    ledger = witness(ledger, { episode: "e2", actor: "A", observer: "B", text: "A hums." });
    ledger = beginEpisode(ledger, "e3");
    expect(seenBefore(ledger, { observer: "B", actor: "A", episode: "e3" }).map((p) => p.text)).toEqual([
      "A works at the window.",
      "A hums.",
      "A strikes the pail.",
    ]);
  });

  it("caps the list at `limit`, keeping the first entries of that order", () => {
    const ledger = beginEpisode(ledgerWithTwoEpisodes(), "e3");
    expect(seenBefore(ledger, { observer: "B", actor: "A", episode: "e3", limit: 1 }).map((p) => p.text)).toEqual(["A works at the window."]);
  });

  it("without `actor`, returns everything this observer witnessed from anyone", () => {
    let ledger = ledgerWithTwoEpisodes();
    ledger = witness(ledger, { episode: "e2", actor: "C", observer: "B", text: "C knocks." });
    ledger = beginEpisode(ledger, "e3");
    expect(seenBefore(ledger, { observer: "B", episode: "e3" }).map((p) => p.text)).toContain("C knocks.");
  });

  it("an episode the ledger never began is refused, rather than read as 'everything'", () => {
    expect(() => seenBefore(ledgerWithTwoEpisodes(), { observer: "B", episode: "e9" })).toThrow(/e9/);
  });

  it("FOG, with a positive control: an account reaches only the observer who witnessed it", () => {
    let ledger = ledgerWithTwoEpisodes();
    ledger = witness(ledger, { episode: "e2", actor: "A", observer: "C", text: "MARKER_ONLY_C_SAW" });
    ledger = beginEpisode(ledger, "e3");
    expect(JSON.stringify(seenBefore(ledger, { observer: "C", episode: "e3" }))).toContain("MARKER_ONLY_C_SAW");
    expect(JSON.stringify(seenBefore(ledger, { observer: "B", episode: "e3" }))).not.toContain("MARKER_ONLY_C_SAW");
    expect(JSON.stringify(seenBefore(ledger, { observer: "A", episode: "e3" }))).not.toContain("MARKER_ONLY_C_SAW");
  });
});

describe("parseLedger refuses anything that is not a ledger, and says why", () => {
  it.each([
    [null, /object/],
    [{ version: 2, episodes: [], accounts: [] }, /version/],
    [{ version: 1, episodes: "e1", accounts: [] }, /episodes/],
    [{ version: 1, episodes: ["e1", "e1"], accounts: [] }, /e1/],
    [{ version: 1, episodes: ["e1"], accounts: [{ episode: "e2", actor: "A", observer: "B", text: "x" }] }, /e2/],
    [{ version: 1, episodes: ["e1"], accounts: [{ episode: "e1", actor: "A", observer: "B", text: 7 }] }, /text/],
  ])("%j", (input, reason) => {
    expect(() => parseLedger(input)).toThrow(reason);
  });
});
