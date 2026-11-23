// cards.js — the four elements and the 24 cards of Ember Court.
//
// Suits are the four elements. Each one is told apart by a colour AND a
// shape glyph, so a card never relies on its name text alone: Flame is the
// orange triangle, Tide the blue circle, Thorn the green cross, Stone the
// gold diamond. Each element has a job — Flame strikes, Tide mends, Thorn
// poisons, Stone guards — and six cards of its own, so a hand always offers
// a choice between hitting, healing, wearing the enemy down, or turtling.
//
// A deck is two copies of every card (48 cards), shuffled with the seeded
// generator from random.js.

import { shuffleDeck } from './random.js';

export const ELEMENTS = {
  flame: { key: 'flame', name: 'Flame', glyph: '▲', colour: '#ff6b35', job: 'Strike' },
  tide: { key: 'tide', name: 'Tide', glyph: '●', colour: '#38b6ff', job: 'Mend' },
  thorn: { key: 'thorn', name: 'Thorn', glyph: '✚', colour: '#7dd956', job: 'Venom' },
  stone: { key: 'stone', name: 'Stone', glyph: '◆', colour: '#e8b93c', job: 'Guard' },
};

// One entry per card. Numbers are the base values before any combo bonus:
// damage hits the enemy, heal restores your own life, poison stacks tick at
// the start of the poisoned side's turn, armor soaks damage before life,
// draw pulls extra cards from your deck.
export const CARD_DEFS = [
  // Flame — Strike
  { id: 'ember-strike', name: 'Ember Strike', element: 'flame', cost: 1, damage: 3 },
  { id: 'kindling', name: 'Kindling', element: 'flame', cost: 1, damage: 2 },
  { id: 'cinder-lash', name: 'Cinder Lash', element: 'flame', cost: 2, damage: 5 },
  { id: 'phoenix-feather', name: 'Phoenix Feather', element: 'flame', cost: 3, damage: 4, draw: 1 },
  { id: 'wildfire', name: 'Wildfire', element: 'flame', cost: 4, damage: 8 },
  { id: 'inferno', name: 'Inferno', element: 'flame', cost: 5, damage: 10 },
  // Tide — Mend
  { id: 'spring-water', name: 'Spring Water', element: 'tide', cost: 1, heal: 4 },
  { id: 'rivers-gift', name: "River's Gift", element: 'tide', cost: 1, heal: 2, draw: 1 },
  { id: 'deep-current', name: 'Deep Current', element: 'tide', cost: 2, heal: 6, draw: 1 },
  { id: 'mist-veil', name: 'Mist Veil', element: 'tide', cost: 2, heal: 5 },
  { id: 'tidal-surge', name: 'Tidal Surge', element: 'tide', cost: 3, heal: 8 },
  { id: 'healing-rain', name: 'Healing Rain', element: 'tide', cost: 4, heal: 10 },
  // Thorn — Venom
  { id: 'thorn-prick', name: 'Thorn Prick', element: 'thorn', cost: 1, poison: 2 },
  { id: 'nettle-lash', name: 'Nettle Lash', element: 'thorn', cost: 1, damage: 2, poison: 1 },
  { id: 'bramble-snare', name: 'Bramble Snare', element: 'thorn', cost: 2, damage: 2, poison: 3 },
  { id: 'spore-cloud', name: 'Spore Cloud', element: 'thorn', cost: 2, poison: 2, draw: 1 },
  { id: 'venom-bloom', name: 'Venom Bloom', element: 'thorn', cost: 3, poison: 5 },
  { id: 'toxic-roots', name: 'Toxic Roots', element: 'thorn', cost: 4, damage: 3, poison: 4 },
  // Stone — Guard
  { id: 'stone-skin', name: 'Stone Skin', element: 'stone', cost: 1, armor: 4 },
  { id: 'pebble-toss', name: 'Pebble Toss', element: 'stone', cost: 1, damage: 2, armor: 2 },
  { id: 'bulwark', name: 'Bulwark', element: 'stone', cost: 2, armor: 7 },
  { id: 'mountain-stance', name: 'Mountain Stance', element: 'stone', cost: 2, armor: 5, draw: 1 },
  { id: 'granite-wall', name: 'Granite Wall', element: 'stone', cost: 3, armor: 10 },
  { id: 'quake-slam', name: 'Quake Slam', element: 'stone', cost: 4, damage: 6, armor: 4 },
];

/** Look a card definition up by its id. */
export function cardDefById(id) {
  return CARD_DEFS.find((def) => def.id === id);
}

/** Build a fresh 48-card deck: two copies of each definition, shuffled. */
export function buildDeck(rng) {
  const deck = [];
  let uid = 0;
  for (const def of CARD_DEFS) {
    for (let copy = 0; copy < 2; copy += 1) {
      deck.push({ uid: uid, def });
      uid += 1;
    }
  }
  return shuffleDeck(rng, deck);
}

/** Make a hand card straight from a definition id (used by shot scenes). */
export function cardFromId(id, uid) {
  return { uid, def: cardDefById(id) };
}

/** The one-line effect text printed on a card face. */
export function cardEffectText(def) {
  const parts = [];
  if (def.damage) parts.push(`Deal ${def.damage}.`);
  if (def.poison) parts.push(`Poison ${def.poison}.`);
  if (def.heal) parts.push(`Heal ${def.heal}.`);
  if (def.armor) parts.push(`Gain ${def.armor} armor.`);
  if (def.draw) parts.push(`Draw ${def.draw}.`);
  return parts.join(' ');
}
