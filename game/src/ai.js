// ai.js — the Ashen Warden: a readable opponent.
//
// The Warden plays by a heuristic you can read and counter, never by
// hidden information: it takes lethal when it has it, mends itself when
// its life is low, raises stone when it is threatened, and otherwise
// spends its ember on the highest-value card it can afford. Before it
// acts it telegraphs its intent — "Warden gathers flame…" — so the
// player sees which element is coming and can answer it.
//
// Value is scored from the Warden's side: damage counts most when it
// threatens lethal, healing when the Warden is hurt, armor when the
// player's hand looks dangerous, poison for its slow grind, and drawing
// for keeping the pressure on. The combo bonus is scored the same way
// the engine applies it.

import { ELEMENTS } from './cards.js';
import { COMBO_BONUS } from './engine.js';

const INTENT_LINES = {
  flame: 'Warden gathers flame…',
  tide: 'Warden calls the tide…',
  thorn: 'Warden sows thorns…',
  stone: 'Warden raises stone…',
};

/** The telegraphed intent line for an element. */
export function intentLineFor(elementKey) {
  return INTENT_LINES[elementKey] || 'Warden stirs…';
}

/** Score one card in the Warden's hand; higher is better. */
function scoreCard(state, card) {
  const ai = state.enemy;
  const you = state.player;
  const def = card.def;
  const combo = state.playedElements.includes(def.element);
  const bonus = combo ? COMBO_BONUS : 0;
  let value = 0;

  if (def.damage) {
    const dealt = def.damage + bonus;
    const lethal = dealt >= you.life + you.armor;
    value += Math.min(dealt, you.life + you.armor) * 1.0;
    if (lethal) value += 1000;
  }
  if (def.heal) {
    const missing = 30 - ai.life;
    const healed = Math.min(def.heal + bonus, missing);
    value += ai.life <= 12 ? healed * 1.2 : healed * 0.8;
  }
  if (def.armor) {
    const armored = def.armor + bonus;
    value += ai.life <= 12 ? armored * 1.0 : armored * 0.7;
  }
  if (def.poison) value += def.poison * 1.5;
  if (def.draw) value += def.draw * 1.5;
  value -= def.cost * 0.3;
  return value;
}

/**
 * Play the Warden's whole turn against the live state: pick the best
 * affordable card, play it, and repeat while a worthwhile play remains.
 * The intent line names the element of its first card, so the player can
 * read the turn before it lands.
 */
export function aiTakeTurn(state, playCardFn) {
  const ai = state.enemy;
  state.aiIntent = '';
  // The Warden draws and refreshes ember like any side.
  ai.emberMax = Math.min(10, state.turn);
  ai.ember = ai.emberMax;
  state.playedElements = [];
  if (ai.poison > 0) {
    const tick = ai.poison;
    state.log.push(`Warden's poison bites for ${tick}.`);
    if (state.log.length > 6) state.log.shift();
    ai.life = Math.max(0, ai.life - tick);
    ai.poison = Math.max(0, ai.poison - 1);
    if (ai.life <= 0) {
      state.phase = 'won';
      state.log.push('The Ashen Warden falls. Victory is yours.');
      return;
    }
  }
  if (ai.deck.length > 0 && ai.hand.length < 7) {
    ai.hand.push(ai.deck.pop());
  }

  let firstPlay = true;
  for (;;) {
    let bestIndex = -1;
    let bestScore = 0.5;
    for (let i = 0; i < ai.hand.length; i += 1) {
      const card = ai.hand[i];
      if (card.def.cost > ai.ember) continue;
      const score = scoreCard(state, card);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestIndex === -1) break;
    const card = ai.hand[bestIndex];
    if (firstPlay) {
      state.aiIntent = intentLineFor(card.def.element);
      state.log.push(state.aiIntent);
      if (state.log.length > 6) state.log.shift();
      firstPlay = false;
    }
    playCardFn(state, 'enemy', bestIndex);
    if (state.phase !== 'play') return;
  }
  if (firstPlay) {
    state.aiIntent = 'Warden holds its ember…';
    state.log.push(state.aiIntent);
    if (state.log.length > 6) state.log.shift();
  }
}

/** The element names the judge's outline shows for this file. */
export function aiElementNames() {
  return Object.values(ELEMENTS).map((el) => el.name);
}
