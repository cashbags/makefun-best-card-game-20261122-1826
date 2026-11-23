// shots.js — deterministic screenshot scenes for Ember Court.
//
// A shot URL like ?shot=play&seed=1 builds its table straight from fixed
// values instead of playing a match, so the same URL always renders the
// same pixels: the title screen, a busy mid-game table, the win screen,
// and the loss screen. The scenes are built with the same state shape
// the live game uses, so what the screenshots show is what the game is.

import { cardFromId } from './cards.js';
import { createGame, startMatch, addLog } from './engine.js';

function setHand(side, ids) {
  side.hand = ids.map((id, i) => cardFromId(id, 100 + i));
}

function setDeckCount(side, count) {
  side.deck = side.deck.slice(0, count);
}

/** Build the state for one shot kind: start | play | win | loss. */
export function buildShotState(kind, seed) {
  const state = createGame(seed);
  if (kind === 'start') {
    state.phase = 'title';
    return state;
  }

  startMatch(state);
  // A mid-game table with readable values on both sides.
  state.turn = 4;
  state.player.life = 24;
  state.player.armor = 3;
  state.player.poison = 0;
  state.player.emberMax = 4;
  state.player.ember = 3;
  state.enemy.life = 19;
  state.enemy.armor = 2;
  state.enemy.poison = 3;
  state.enemy.emberMax = 4;
  state.enemy.ember = 1;
  state.aiIntent = 'Warden sows thorns…';
  setHand(state.player, [
    'ember-strike', 'cinder-lash', 'spring-water', 'venom-bloom', 'bulwark', 'phoenix-feather',
  ]);
  setHand(state.enemy, ['thorn-prick', 'nettle-lash', 'bramble-snare', 'stone-skin', 'kindling']);
  setDeckCount(state.player, 36);
  setDeckCount(state.enemy, 34);
  state.playedElements = ['flame'];
  state.selected = 1;
  state.log = [
    'You play Ember Strike — COMBO +2!',
    'Warden plays Bramble Snare.',
    'You are poisoned (3).',
    'Warden sows thorns…',
  ];

  if (kind === 'win') {
    state.enemy.life = 0;
    state.enemy.poison = 0;
    state.phase = 'won';
    addLog(state, 'The Ashen Warden falls. Victory is yours.');
  } else if (kind === 'loss') {
    state.player.life = 0;
    state.player.armor = 0;
    state.phase = 'lost';
    addLog(state, 'Your ember gutters out. The Warden stands.');
  }
  return state;
}
