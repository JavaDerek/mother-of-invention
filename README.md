# mother-of-invention

Necessity is the mother of invention. This package is for making a mind invent: mechanisms that
stimulate novel attempts from language-model agents, each generic, each usable by any game that puts
models in charge of characters.

A language model asked to act has no reason to try anything but the obvious, because the obvious
approach is the sensible one. The mechanisms here give it reasons.

## Mechanisms

### Precedent: what an observer has already seen tried

The first mechanism. If nobody in a mind's world remembers the obvious approach being tried, nothing
pushes it anywhere else. The precedent ledger keeps that memory as plain data, per observer and
across episodes, so a caller can put it to a mind in its own fiction: *this guard has seen that trick
before*, *these envoys have heard that offer already*.

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

#### The model

- **Episode:** one run. Episodes are ordered by when `beginEpisode` was called, and that order is what
  "before" means.
- **Account:** in one episode, one actor attempted something and one observer perceived it, in `text`.
- **`seenBefore`:** everything one observer witnessed in earlier episodes, optionally from one actor,
  grouped by identical text and ordered most recent first, then most frequent. `limit` keeps the top.

#### Deliberately not here

- **Deciding what counts as a repeat.** Two accounts match only when their text is identical. Judging
  whether two phrasings are one idea is a judgement about meaning, and this package makes none. Record
  coarser text (what the observer perceived, not what the actor said) for coarser repeats.
- **Storage.** You keep the JSON.
- **Prompt text.** How precedent is put to a mind is your content.
- **Sharing.** An account reaches only the observer named on it. Record one per observer.

### Pick: a forced choice away from what is already seen

The second mechanism. Asking a mind to list alternatives does not change what it chooses, and a stated
cost for the obvious approach does not either. Pick is a declared, partial force: on a turn the caller
marks as forced, a choice the observer has already seen is replaced by the first of the mind's own
candidates that is neither seen nor unavailable. Free turns are left alone and consult nothing, so they
stay comparable with a run without pick.

Whether a text is "seen" is a judgement about meaning, so the caller injects it. When every candidate is
already seen, a caller may supply `regenerate`, which is asked once for fresh candidates and told every
verdict (usually by asking the same mind again, told what is already known). The choice is always one of
the mind's own texts: code picks among them and never writes one.

```ts
import { pick } from "mother-of-invention";

const picked = await pick(ownChoice, candidates, {
  force: turn % 2 === 0,
  recognise: async (text) => ((await isKnown(text)) ? "seen" : (await isPossible(text)) ? "unseen" : "unavailable"),
  regenerate: async (verdicts) => askTheMindAgain(verdicts), // optional
});
// picked.chosen, picked.overridden, picked.verdicts, picked.regenerated?
```

**What it was measured to do** in its first caller, a two-principal game with a 22-episode ledger, 3
runs a side: forced turns that actually did something unseen went from 23% to 65% with `regenerate`.
Six of eleven turns with nothing unseen became ideas the mind produced only when told its list was
already known. Turns that were not forced did not change, so pick gives a mind new attempts but has not
yet been shown to make it choose them unforced.

## License

MIT
