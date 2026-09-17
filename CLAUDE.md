# mother-of-invention — Claude Context

## What this is

The home for mechanisms that stimulate novel thought in model-driven agents. Necessity is the mother
of invention: a mind that has no reason to try anything but the obvious will not, so each mechanism
here gives it a reason, generically, for any game that puts models in charge of characters.

The owner's framing (2026-09-14): there may be many ways to stimulate novelty, and anything this work
needs lives here. **Precedent is the first, not the scope.**

### Mechanism 1: precedent (`src/ledger.ts`)

What an observer has already seen attempted, across episodes. A plain-data ledger of accounts (per
episode: this actor attempted something, this observer perceived it, in these words) and one query,
`seenBefore`: what has this observer witnessed, before this episode? A caller puts that to a mind from
inside its own fiction, which makes the obvious approach stale honestly rather than by fiat.

### Mechanism 2: pick (`src/pick.ts`)

A forced choice away from what an observer has seen: on a forced turn, the first candidate the
injected recogniser calls `unseen` replaces a seen or unavailable choice; with none, an optional
`regenerate` is asked once for fresh candidates. Driven and measured first in The Prisoner
(its OPEN-VARIANT §21, §32, §36) before it moved here: regeneration raised forced turns that did
something unseen from 23% to 65%, and free turns did not change. Never decides what a text means (the
recogniser is injected) and never writes a text (it chooses among the mind's own).

### Adding a mechanism

Always: generic (no consumer's words, by test), never deciding by code what text means, and at least
one real caller before it ships. Today the whole package also has no I/O and no runtime dependencies,
each by test. Those two describe what exists, not a ceiling: a mechanism that genuinely needs more (a
model call, say) changes the guard deliberately, in its own commit, saying why.

## Its consumers, and it belongs to none of them

Decided by the owner on 2026-09-14, as its own package rather than part of `mind-seam` (whose
CLAUDE.md forbids context fields and storage) or `run-dmcp` (which never holds free-text attempts).

- **The Prisoner** (a two-principal game), the first real caller: Croft's experience of what prisoners
  have tried in this cell, which Voss knows Croft has seen.
- **brink** (a turn-based game), the intended second: a world leader's memory of the diplomatic
  swindles other leaders have already been seen to try.

Their words are forbidden in this tree by `src/__tests__/vocabulary.test.ts` (tracked and untracked
files). Observer, actor, episode, account, witness, ledger, precedent and attempt are this package's
words.

## What precedent will not do

- **Decide what counts as a repeat.** Accounts are the same only when their text is identical. Whether
  two phrasings are one idea is a judgement about meaning, and code never makes one here. A caller that
  wants coarser repeats records coarser text, such as the sentence the observer actually perceived.
- **Store anything.** A ledger is plain JSON; the caller keeps it and hands it back through
  `parseLedger`. `src/__tests__/noIo.test.ts` scans the source for read, write and network tokens.
- **Write the prompt.** How "already seen" is put to a mind, and in whose voice, is caller content.

## Fog

An account reaches the observer named on it and no one else. `seenBefore` never widens that: there is
no "everyone" query. If a caller wants two observers to share a memory, it records two accounts.

## Zero runtime dependencies, by test

`dependencies` is `{}`, asserted by `src/__tests__/zeroDependencies.test.ts`.

## TDD is mandatory

Write the failing test first and confirm it fails for the right reason. A guard is validated by
planting a violation and watching it go red before it is trusted.

## Publishing and consumers

Tag-triggered npm trusted publisher, copied from mind-seam's `release.yml`; the first publish is a
human step (trusted publishing needs the package to exist). Consumers pin exactly and never link.
Semver 0.x: a change to `seenBefore`'s ordering or grouping, or to what `parseLedger` accepts, is a
minor; a new optional export is a patch.
