/**
 * What an observer has already seen attempted, across episodes.
 *
 * A mind that is never told what has been tried before has no reason to try
 * anything else: the obvious approach is always the sensible one. This
 * module keeps the record that lets a caller say so -- per episode, per
 * observer, in the observer's own terms -- and answers one question: what has
 * this observer witnessed, before this episode?
 *
 * What it deliberately does not do:
 *
 * - **Decide what counts as a repeat.** Two accounts are the same only when
 *   their text is identical. Whether "scrapes at the window" and "files the
 *   window" are one idea is a judgement about meaning, and code here never
 *   makes one. A caller that wants coarser repeats records coarser text (for
 *   example, the sentence the observer actually perceived, rather than the
 *   actor's own words).
 * - **Store anything.** A ledger is plain JSON. Where it lives -- a file, a
 *   row, memory -- is the caller's choice; `parseLedger` validates it on the
 *   way back in.
 * - **Write the prompt.** How "already seen" is put to a mind, and in whose
 *   voice, is the caller's content.
 *
 * Everything here is a `type` alias, never an `interface`, so a value can sit
 * inside a context that requires an implicit index signature.
 */

export type Account = {
  /** The episode it happened in; must already have been begun. */
  readonly episode: string;
  /** Who attempted it. */
  readonly actor: string;
  /** Who witnessed it. An account reaches this observer and no one else. */
  readonly observer: string;
  /** What the observer perceived, as the caller rendered it. */
  readonly text: string;
};

export type Ledger = {
  readonly version: 1;
  /** Episodes in the order they were begun. This order is what "before" means. */
  readonly episodes: readonly string[];
  readonly accounts: readonly Account[];
};

/** One distinct thing an observer has seen, with how often. */
export type Precedent = {
  readonly text: string;
  /** Accounts with exactly this text. */
  readonly times: number;
  /** Distinct earlier episodes it appeared in. */
  readonly episodes: number;
  /** The most recent earlier episode it appeared in. */
  readonly lastEpisode: string;
};

export function emptyLedger(): Ledger {
  return { version: 1, episodes: [], accounts: [] };
}

export function beginEpisode(ledger: Ledger, episode: string): Ledger {
  requireText(episode, "episode");
  if (ledger.episodes.includes(episode)) {
    throw new Error(`witnessed: episode ${JSON.stringify(episode)} has already been begun`);
  }
  return { ...ledger, episodes: [...ledger.episodes, episode] };
}

export function witness(ledger: Ledger, account: Account): Ledger {
  checkAccount(account, ledger.episodes);
  const { episode, actor, observer, text } = account;
  return { ...ledger, accounts: [...ledger.accounts, { episode, actor, observer, text }] };
}

/**
 * Everything `observer` witnessed in episodes begun before `episode`,
 * optionally only from `actor`, grouped by exact text. Ordered by most
 * recent episode first, then by how many times it was seen, then by first
 * appearance -- so a `limit` keeps what is freshest and most worn.
 */
export function seenBefore(
  ledger: Ledger,
  query: { observer: string; episode: string; actor?: string; limit?: number }
): Precedent[] {
  const position = ledger.episodes.indexOf(query.episode);
  if (position === -1) {
    throw new Error(`witnessed: episode ${JSON.stringify(query.episode)} has not been begun`);
  }
  const earlier = new Map(ledger.episodes.slice(0, position).map((e, i) => [e, i]));

  const byText = new Map<string, { times: number; episodes: Set<string>; last: number; first: number }>();
  ledger.accounts.forEach((a, index) => {
    const order = earlier.get(a.episode);
    if (order === undefined || a.observer !== query.observer) return;
    if (query.actor !== undefined && a.actor !== query.actor) return;
    const entry = byText.get(a.text) ?? { times: 0, episodes: new Set<string>(), last: -1, first: index };
    entry.times += 1;
    entry.episodes.add(a.episode);
    entry.last = Math.max(entry.last, order);
    byText.set(a.text, entry);
  });

  const precedents = [...byText.entries()]
    .sort(([, x], [, y]) => y.last - x.last || y.times - x.times || x.first - y.first)
    .map(([text, e]) => ({ text, times: e.times, episodes: e.episodes.size, lastEpisode: ledger.episodes[e.last] }));
  return query.limit === undefined ? precedents : precedents.slice(0, Math.max(0, query.limit));
}

/** Validates a ledger read back from wherever the caller keeps it. */
export function parseLedger(value: unknown): Ledger {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("witnessed: a ledger must be an object");
  }
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1) throw new Error(`witnessed: unsupported ledger version ${JSON.stringify(raw.version)}`);
  if (!Array.isArray(raw.episodes) || !raw.episodes.every((e) => typeof e === "string")) {
    throw new Error("witnessed: episodes must be an array of strings");
  }
  if (!Array.isArray(raw.accounts)) throw new Error("witnessed: accounts must be an array");

  let ledger = emptyLedger();
  for (const episode of raw.episodes as string[]) ledger = beginEpisode(ledger, episode);
  for (const account of raw.accounts) {
    if (typeof account !== "object" || account === null) throw new Error("witnessed: each account must be an object");
    ledger = witness(ledger, account as Account);
  }
  return ledger;
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`witnessed: ${field} must be a non-empty string`);
  }
}

function checkAccount(account: Account, episodes: readonly string[]): void {
  requireText(account.episode, "episode");
  requireText(account.actor, "actor");
  requireText(account.observer, "observer");
  requireText(account.text, "text");
  if (!episodes.includes(account.episode)) {
    throw new Error(`witnessed: episode ${JSON.stringify(account.episode)} has not been begun`);
  }
}
