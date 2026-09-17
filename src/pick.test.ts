import { describe, it, expect } from "vitest";
import { pick, type Verdict } from "./pick.js";

// Mechanism 2 (CLAUDE.md): pick. A forced choice away from what an observer has
// already seen, with the recogniser injected and one regeneration when the
// candidates offer nothing unseen. Driven first in a real caller, where a
// with/without comparison measured it before it moved here.
function table(verdicts: Record<string, Verdict>) {
  return (candidate: string) => verdicts[candidate] ?? "unseen";
}

describe("pick: a forced choice away from what is already seen, with the recogniser injected", () => {
  it("a free turn keeps the mind's own choice and asks the recogniser nothing", async () => {
    let asked = 0;
    const picked = await pick("a", ["a", "b"], { force: false, recognise: () => (asked++, "seen") });
    expect(picked).toEqual({ chosen: "a", forced: false, overridden: false, verdicts: [] });
    expect(asked).toBe(0);
  });

  it("a forced turn keeps the mind's own choice when it is unseen", async () => {
    const picked = await pick("a", ["b"], { force: true, recognise: table({ b: "seen" }) });
    expect(picked.chosen).toBe("a");
    expect(picked.overridden).toBe(false);
  });

  it("a forced turn replaces a seen choice with the first unseen candidate, in the mind's own order, skipping unavailable ones", async () => {
    const picked = await pick("a", ["a", "b", "c", "d"], { force: true, recognise: table({ a: "seen", b: "unavailable", c: "unseen", d: "unseen" }) });
    expect(picked.chosen).toBe("c");
    expect(picked.overridden).toBe(true);
    expect(picked.verdicts).toEqual([
      { candidate: "a", verdict: "seen" },
      { candidate: "b", verdict: "unavailable" },
      { candidate: "c", verdict: "unseen" },
      { candidate: "d", verdict: "unseen" },
    ]);
  });

  it("a forced turn with nothing unseen to force to keeps the mind's own choice, and says so", async () => {
    const picked = await pick("a", ["b"], { force: true, recognise: table({ a: "seen", b: "unavailable" }) });
    expect(picked).toMatchObject({ chosen: "a", forced: true, overridden: false });
  });

  it("regenerate: a forced turn with nothing unseen asks once for fresh candidates, told every verdict, and picks the first unseen of those", async () => {
    const asked: unknown[] = [];
    const picked = await pick("a", ["a", "b"], {
      force: true,
      recognise: table({ a: "seen", b: "unavailable", c: "seen", d: "unseen" }),
      regenerate: async (verdicts) => (asked.push(verdicts), ["c", "d"]),
    });
    expect(asked).toEqual([[{ candidate: "a", verdict: "seen" }, { candidate: "b", verdict: "unavailable" }]]);
    expect(picked).toMatchObject({ chosen: "d", forced: true, overridden: true });
    expect(picked.regenerated).toEqual([{ candidate: "c", verdict: "seen" }, { candidate: "d", verdict: "unseen" }]);
  });

  it("regenerate is never called on a free turn, when the own choice is unseen, or when a first-round candidate is unseen", async () => {
    let calls = 0;
    const regenerate = async () => (calls++, ["z"]);
    await pick("a", ["b"], { force: false, recognise: table({ a: "seen" }), regenerate });
    await pick("a", ["b"], { force: true, recognise: table({ a: "unseen" }), regenerate });
    const picked = await pick("a", ["b"], { force: true, recognise: table({ a: "seen", b: "unseen" }), regenerate });
    expect(calls).toBe(0);
    expect(picked.regenerated).toBeUndefined();
  });

  it("regenerated candidates with nothing unseen keep the mind's own choice, and the attempt is still recorded", async () => {
    const picked = await pick("a", ["a"], { force: true, recognise: table({ a: "seen", c: "seen" }), regenerate: async () => ["c", "a"] });
    expect(picked).toMatchObject({ chosen: "a", forced: true, overridden: false });
    // A regenerated text already judged is not asked again.
    expect(picked.regenerated).toEqual([{ candidate: "c", verdict: "seen" }]);
  });

  it("an unavailable own choice is replaced on a forced turn too: forcing never spends the turn on nothing", async () => {
    const picked = await pick("a", ["b"], { force: true, recognise: table({ a: "unavailable", b: "unseen" }) });
    expect(picked.chosen).toBe("b");
  });
});

