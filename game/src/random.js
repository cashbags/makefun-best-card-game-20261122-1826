// random.js — the seeded number source for Ember Court.
//
// Every shuffle and every AI coin-flip in the game draws from one of these
// generators, so a fixed seed always rebuilds the same deck order and the
// same screenshot scenes. The generator is mulberry32: small, fast, and
// good enough for a card game that never needs cryptographic randomness.

/** Build a deterministic generator from any integer seed. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shuffle an array in place with the given generator (Fisher-Yates). */
export function shuffleDeck(rng, cards) {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const held = cards[i];
    cards[i] = cards[j];
    cards[j] = held;
  }
  return cards;
}

/** Pick an integer in [0, count) from the generator. */
export function rollBelow(rng, count) {
  return Math.floor(rng() * count);
}
