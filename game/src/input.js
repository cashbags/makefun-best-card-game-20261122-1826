// input.js — keyboard and mouse controls for Ember Court.
//
// Mouse: click a hand card to select it (it lifts), click it again to
// play it; click the End Turn button to end the turn; click anywhere on
// the title or end screens to start (or restart) a match.
// Keyboard: 1–7 select a hand card, Enter or Space plays the selected
// card (or starts the match), Esc or E ends the turn.
//
// Every gesture also unlocks audio, since browsers only allow sound
// after the player has interacted with the page. The state is read
// through a getter on every event, because a restart swaps the state
// object and the handlers must always see the live one.

import { END_TURN, handCardRects } from './render.js';
import { unlockAudio } from './audio.js';

/** Convert a mouse event into canvas coordinates (the canvas is scaled by CSS). */
function eventPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

/** True when a point lies inside a rectangle. */
function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

/**
 * Wire the canvas and the keyboard to the game. getState returns the live
 * match state; handlers carries the actions main.js provides: start,
 * selectCard, playSelected, playCard, endTurn.
 */
export function attachInput(canvas, getState, handlers) {
  canvas.addEventListener('pointerdown', (event) => {
    unlockAudio();
    const state = getState();
    const point = eventPoint(canvas, event);
    if (state.phase === 'title' || state.phase === 'won' || state.phase === 'lost') {
      handlers.start();
      return;
    }
    if (state.phase !== 'play') return;
    if (inside(point, END_TURN)) {
      handlers.endTurn();
      return;
    }
    const rects = handCardRects(state);
    for (let i = rects.length - 1; i >= 0; i -= 1) {
      const r = rects[i];
      if (inside(point, { x: r.x, y: r.y - r.lift, w: r.w, h: r.h })) {
        if (state.selected === i) handlers.playSelected();
        else handlers.selectCard(i);
        return;
      }
    }
    state.selected = -1;
  });

  canvas.addEventListener('pointermove', (event) => {
    const state = getState();
    const point = eventPoint(canvas, event);
    if (state.phase !== 'play') {
      state.hovered = -1;
      return;
    }
    const rects = handCardRects(state);
    state.hovered = -1;
    for (let i = rects.length - 1; i >= 0; i -= 1) {
      const r = rects[i];
      if (inside(point, { x: r.x, y: r.y - r.lift, w: r.w, h: r.h })) {
        state.hovered = i;
        break;
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    unlockAudio();
    const state = getState();
    if (state.phase === 'title' || state.phase === 'won' || state.phase === 'lost') {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handlers.start();
      }
      return;
    }
    if (state.phase !== 'play') return;
    if (event.key >= '1' && event.key <= '7') {
      const index = Number(event.key) - 1;
      if (index < state.player.hand.length) {
        if (state.selected === index) handlers.playSelected();
        else handlers.selectCard(index);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlers.playSelected();
    } else if (event.key === 'Escape' || event.key === 'e' || event.key === 'E') {
      handlers.endTurn();
    }
  });
}
