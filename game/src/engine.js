// engine.js — the rules of Ember Court: turns, ember, combat, combos.
//
// A match is a state object with two sides ("player" and "enemy"). Each
// side has life (30 to win the race), armor (soaks damage before life),
// poison stacks (they tick at the start of that side's turn and seep past
// armor), a deck, a hand of at most 7 cards, and ember — the mana that
// starts at 1, grows by 1 every turn to a max of 10, and never carries over.
//
// The combo rule is the decision of every hand: the first card of an
// element played in a turn is at face value; a second card of the same
// element in the same turn gets +2 to its damage, heal, or armor. Poison
// is not bonused — venom is already patient enough.

import { buildDeck } from './cards.js';
import { makeRng } from './random.js';

export const MAX_LIFE = 30;
export const MAX_HAND = 7;
export const MAX_EMBER = 10;
export const COMBO_BONUS = 2;

/** A fresh side: life, armor, poison, deck, hand, ember. */
export function newSide(rng) {
  return {
    life: MAX_LIFE,
    armor: 0,
    poison: 0,
    deck: buildDeck(rng),
    hand: [],
    ember: 0,
    emberMax: 1,
  };
}

/** A fresh match in the title phase, before anyone has drawn. */
export function createGame(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    rng,
    phase: 'title', // title | play | won | lost
    turn: 1,
    player: newSide(rng),
    enemy: newSide(rng),
    playedElements: [],
    selected: -1,
    hovered: -1,
    aiIntent: '',
    log: [],
    lastPlay: null,
  };
  return state;
}

/** Append a line to the match log, keeping only the newest few. */
export function addLog(state, line) {
  state.log.push(line);
  if (state.log.length > 6) state.log.shift();
}

/** Draw up to n cards; a hand past 7 discards the drawn card. */
export function drawCards(state, sideKey, n) {
  const side = state[sideKey];
  for (let i = 0; i < n; i += 1) {
    if (side.deck.length === 0) return;
    const card = side.deck.pop();
    if (side.hand.length >= MAX_HAND) {
      addLog(state, `${sideKey === 'player' ? 'You' : 'Warden'} overdraw — a card burns away.`);
      continue;
    }
    side.hand.push(card);
  }
}

/** Deal damage to a side: armor soaks it first, then life. */
export function dealDamage(state, sideKey, amount) {
  const side = state[sideKey];
  let left = amount;
  if (side.armor > 0) {
    const soaked = Math.min(side.armor, left);
    side.armor -= soaked;
    left -= soaked;
  }
  side.life = Math.max(0, side.life - left);
  checkEnd(state);
  return left;
}

/** Poison damage: it seeps past armor, straight to life. */
export function dealPoisonDamage(state, sideKey, amount) {
  const side = state[sideKey];
  side.life = Math.max(0, side.life - amount);
  checkEnd(state);
}

/** End the match the moment either life total reaches zero. */
export function checkEnd(state) {
  if (state.phase !== 'play') return;
  if (state.enemy.life <= 0) {
    state.phase = 'won';
    addLog(state, 'The Ashen Warden falls. Victory is yours.');
  } else if (state.player.life <= 0) {
    state.phase = 'lost';
    addLog(state, 'Your ember gutters out. The Warden stands.');
  }
}

/** Start a side's turn: refresh ember, tick poison, draw a card. */
export function beginTurn(state, sideKey) {
  const side = state[sideKey];
  side.emberMax = Math.min(MAX_EMBER, state.turn);
  side.ember = side.emberMax;
  state.playedElements = [];
  if (side.poison > 0) {
    const tick = side.poison;
    addLog(state, `${sideKey === 'player' ? 'Your' : "Warden's"} poison bites for ${tick}.`);
    dealPoisonDamage(state, sideKey, tick);
    side.poison = Math.max(0, side.poison - 1);
    if (state.phase !== 'play') return;
  }
  drawCards(state, sideKey, 1);
}

/** Leave the title screen and deal the opening hands. */
export function startMatch(state) {
  state.phase = 'play';
  state.turn = 1;
  state.log = [];
  addLog(state, 'The court is lit. Your move, ember-bearer.');
  drawCards(state, 'player', 3);
  drawCards(state, 'enemy', 4);
  beginTurn(state, 'player'); // the turn's draw brings the player to 4
}

/**
 * Play a card from a side's hand. Returns true when the card was played.
 * The combo bonus applies when this turn already saw the same element.
 */
export function playCard(state, sideKey, handIndex) {
  const side = state[sideKey];
  const foeKey = sideKey === 'player' ? 'enemy' : 'player';
  const foe = state[foeKey];
  const card = side.hand[handIndex];
  if (!card || state.phase !== 'play') return false;
  if (card.def.cost > side.ember) return false;

  const combo = state.playedElements.includes(card.def.element);
  const bonus = combo ? COMBO_BONUS : 0;
  side.ember -= card.def.cost;
  side.hand.splice(handIndex, 1);
  state.playedElements.push(card.def.element);
  state.lastPlay = { side: sideKey, card, combo };
  const who = sideKey === 'player' ? 'You play' : 'Warden plays';
  addLog(state, `${who} ${card.def.name}${combo ? ' — COMBO +2!' : ''}.`);

  if (card.def.damage) {
    const dealt = card.def.damage + bonus;
    dealDamage(state, foeKey, dealt);
    if (state.phase !== 'play') return true;
  }
  if (card.def.poison) {
    foe.poison += card.def.poison;
    addLog(state, `${foeKey === 'player' ? 'You are' : 'Warden is'} poisoned (${foe.poison}).`);
  }
  if (card.def.armor) {
    side.armor += card.def.armor + bonus;
  }
  if (card.def.heal) {
    side.life = Math.min(MAX_LIFE, side.life + card.def.heal + bonus);
  }
  if (card.def.draw) {
    drawCards(state, sideKey, card.def.draw);
  }
  return true;
}

/** The player ends their turn; the Warden answers, then a new turn opens. */
export function endPlayerTurn(state, aiTakeTurn) {
  if (state.phase !== 'play') return;
  state.selected = -1;
  aiTakeTurn(state);
  if (state.phase !== 'play') return;
  state.turn += 1;
  addLog(state, `— Turn ${state.turn} —`);
  beginTurn(state, 'player');
}
