# mother-of-invention

Necessity is the mother of invention. This package keeps the necessity: what an observer has already
seen attempted, across episodes.

A language model asked to act has no reason to try anything but the obvious: the obvious approach is
the sensible one. If nobody in its world remembers the obvious approach being tried, nothing pushes it
anywhere else. `mother-of-invention` keeps that memory as plain data, per observer, so a caller can put it to a
mind in its own fiction: *this guard has seen that trick before*, *these envoys have heard that offer
already*.

Zero runtime dependencies. No I/O. The ledger is JSON you keep wherever you like.

```ts
import { emptyLedger, beginEpisode, witness, seenBefore, parseLedger } from "mother-of-invention";

let ledger = emptyLedger();
ledger = beginEpisode(ledger, "episode-1");
ledger = witness(ledger, { episode: "episode-1", actor: "A", observer: "B", text: "A works at the window." });

ledger = beginEpisode(ledger, "episode-2");
seenBefore(ledger, { observer: "B", actor: "A", episode: "episode-2" });
// [{ text: "A works at the window.", times: 1, episodes: 1, lastEpisode: "episode-1" }]

const saved = JSON.stringify(ledger);
ledger = parseLedger(JSON.parse(saved)); // validated on the way back in
```

## The model

- **Episode:** one run. Episodes are ordered by when `beginEpisode` was called, and that order is what
  "before" means.
- **Account:** in one episode, one actor attempted something and one observer perceived it, in `text`.
- **`seenBefore`:** everything one observer witnessed in earlier episodes, optionally from one actor,
  grouped by identical text and ordered most recent first, then most frequent. `limit` keeps the top.

## Deliberately not here

- **Deciding what counts as a repeat.** Two accounts match only when their text is identical. Judging
  whether two phrasings are one idea is a judgement about meaning, and this package makes none. Record
  coarser text (what the observer perceived, not what the actor said) for coarser repeats.
- **Storage.** You keep the JSON.
- **Prompt text.** How precedent is put to a mind is your content.
- **Sharing.** An account reaches only the observer named on it. Record one per observer.

## License

MIT
