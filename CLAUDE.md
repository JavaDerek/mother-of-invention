# witnessed — Claude Context

## What this is

What an observer has already seen attempted, across episodes. A plain-data ledger of accounts (per
episode: this actor attempted something, this observer perceived it, in these words) and one query,
`seenBefore`: what has this observer witnessed, before this episode?

It exists because a mind that is never told what has been tried before has no reason to try anything
else. The obvious approach is always the sensible one; necessity is what makes invention sensible.
This package keeps the record a caller needs to create that necessity honestly, from inside its own
fiction.

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

## What it will not do

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
