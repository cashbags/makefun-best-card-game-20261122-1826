// main.js — boot and wiring for Ember Court.
//
// Reads ?shot=start|play|win|loss&seed=N for the deterministic screenshot
// scenes (shots.js builds those states directly); without a shot it opens
// on the title screen and lets the player start a fresh match. The render
// loop redraws the canvas every frame, and the handlers below connect the
// input layer to the engine and the AI.

import { createGame, startMatch, playCard, endPlayerTurn } from './engine.js';
import { aiTakeTurn } from './ai.js';
import { renderGame, CANVAS_W, CANVAS_H } from './render.js';
import { attachInput } from './input.js';
import { buildShotState } from './shots.js';
import { playSound } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

/** The live match state, or a fixed shot scene when ?shot= is given. */
let state = shot ? buildShotState(shot, seed) : createGame(seed);
const isShot = Boolean(shot);

/** Begin (or restart) a match from the title or end screens. */
function startGame() {
  const fresh = createGame((Math.random() * 2147483647) | 0);
  state = fresh;
  startMatch(state);
  playSound('turn');
}

/** Play the selected card, if the player can afford it. */
function playSelectedCard() {
  if (state.phase !== 'play' || state.selected < 0) return;
  const card = state.player.hand[state.selected];
  if (!card) return;
  const ok = playCard(state, 'player', state.selected);
  if (!ok) return;
  state.selected = -1;
  if (card.def.damage) playSound('hit');
  else if (card.def.heal) playSound('heal');
  else if (card.def.poison) playSound('poison');
  else if (card.def.armor) playSound('armor');
  else playSound('play');
  if (state.phase === 'won') playSound('win');
  if (state.phase === 'lost') playSound('lose');
}

/** End the player's turn: the Warden answers, then a new turn opens. */
function endTurn() {
  if (state.phase !== 'play') return;
  playSound('turn');
  endPlayerTurn(state, (s) => aiTakeTurn(s, playCard));
  if (state.phase === 'won') playSound('win');
  if (state.phase === 'lost') playSound('lose');
}

// Shot scenes never restart: the start handler would swap the state the
// screenshot is taken from, so a shot page gets handlers that do nothing.
const liveHandlers = {
  start: startGame,
  selectCard: (index) => { state.selected = index; },
  playSelected: playSelectedCard,
  playCard: (index) => {
    state.selected = index;
    playSelectedCard();
  },
  endTurn,
};
const shotHandlers = {
  start: () => {},
  selectCard: () => {},
  playSelected: () => {},
  playCard: () => {},
  endTurn: () => {},
};
attachInput(canvas, () => state, isShot ? shotHandlers : liveHandlers);

function frame() {
  renderGame(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Debug handle for automated play-testing: exposes the live state so a
// test driver can read life totals, hands, and the match phase.
window.__ember = { get state() { return state; } };
