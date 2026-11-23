// render.js — everything Ember Court shows on its 1280×800 canvas.
//
// The table is drawn in layers: a dark felt background with an ember glow,
// the Warden's side at the top (name, life bar, armor and poison badges,
// ember pips, a fan of face-down cards), the middle of the table (turn,
// intent line, combo callout, match log), and the player's side at the
// bottom (life bar, ember, a hand of readable cards, End Turn button).
// Cards are told apart by colour AND shape glyph, never by text alone.
// Title, win, and loss screens are full-canvas overlays on the same table.

import { ELEMENTS, cardEffectText } from './cards.js';

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const CARD_W = 150;
export const CARD_H = 208;
export const END_TURN = { x: 1090, y: 395, w: 160, h: 56 };

/** Round a rectangle path on the context. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Wrap text to fit a width; returns the lines. */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The dark felt table with a warm ember glow in the middle. */
function drawTableFelt(ctx) {
  const grad = ctx.createRadialGradient(640, 400, 80, 640, 400, 760);
  grad.addColorStop(0, '#2c3a2e');
  grad.addColorStop(0.55, '#1d2a20');
  grad.addColorStop(1, '#10160f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = 'rgba(232, 185, 60, 0.35)';
  ctx.lineWidth = 3;
  roundRect(ctx, 14, 14, CANVAS_W - 28, CANVAS_H - 28, 26);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 107, 53, 0.05)';
  ctx.beginPath();
  ctx.ellipse(640, 400, 420, 130, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A life bar with the numeric total written on it. Badges live beside it. */
function drawLifeBar(ctx, x, y, w, label, life) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  roundRect(ctx, x, y, w, 34, 8);
  ctx.fill();
  const frac = Math.max(0, life / 30);
  const bar = ctx.createLinearGradient(x, y, x + w, y);
  bar.addColorStop(0, '#e5484d');
  bar.addColorStop(1, '#ff7a59');
  ctx.fillStyle = bar;
  if (frac > 0) {
    roundRect(ctx, x + 3, y + 3, (w - 6) * frac, 28, 6);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${label}  LIFE ${life} / 30`, x + 12, y + 18);
}

/** Armor and poison pills, drawn as separate badges right of the life bar. */
function drawBadges(ctx, x, y, armor, poison) {
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let bx = x;
  if (armor > 0) {
    const label = `ARMOR ${armor}`;
    const w = ctx.measureText(label).width + 24;
    ctx.fillStyle = 'rgba(232, 185, 60, 0.22)';
    roundRect(ctx, bx, y, w, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#e8b93c';
    ctx.fillText(label, bx + 12, y + 18);
    bx += w + 10;
  }
  if (poison > 0) {
    const label = `POISON ${poison}`;
    const w = ctx.measureText(label).width + 24;
    ctx.fillStyle = 'rgba(125, 217, 86, 0.22)';
    roundRect(ctx, bx, y, w, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#7dd956';
    ctx.fillText(label, bx + 12, y + 18);
  }
}

/** Ember pips: filled for ember left, dim for ember spent. */
function drawEmberPips(ctx, x, y, ember, emberMax) {
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER', x, y);
  for (let i = 0; i < emberMax; i += 1) {
    const cx = x + 78 + i * 26;
    ctx.beginPath();
    ctx.arc(cx, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < ember ? '#ff6b35' : 'rgba(255, 255, 255, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText(`${ember} / ${emberMax}`, x + 78 + emberMax * 26 + 8, y);
}

/** One face-up card: element band, glyph, name, cost, effect. */
export function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.def.element];
  const playable = opts.playable !== false;
  const lift = opts.lift || 0;
  const cy = y - lift;
  ctx.save();
  if (!playable) ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#f7f1e3';
  roundRect(ctx, x, cy, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = opts.selected ? '#ffd166' : 'rgba(0,0,0,0.55)';
  ctx.lineWidth = opts.selected ? 5 : 2;
  ctx.stroke();
  // Element band.
  ctx.fillStyle = el.colour;
  roundRect(ctx, x + 4, cy + 4, w - 8, 46, 9);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.glyph, x + 12, cy + 28);
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(el.name.toUpperCase(), x + 44, cy + 28);
  // Cost coin.
  ctx.beginPath();
  ctx.arc(x + w - 26, cy + 27, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#1d2a20';
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.def.cost), x + w - 26, cy + 28);
  // Name.
  ctx.fillStyle = '#1d2a20';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  const nameLines = wrapText(ctx, card.def.name, w - 20);
  nameLines.forEach((line, i) => ctx.fillText(line, x + w / 2, cy + 72 + i * 20));
  // Big glyph watermark.
  ctx.fillStyle = el.colour;
  ctx.globalAlpha = playable ? 0.28 : 0.16;
  ctx.font = '76px Georgia, serif';
  ctx.fillText(el.glyph, x + w / 2, cy + 128);
  ctx.globalAlpha = playable ? 1 : 0.55;
  // Effect text.
  ctx.fillStyle = '#33302a';
  ctx.font = '15px Georgia, serif';
  const effectLines = wrapText(ctx, cardEffectText(card.def), w - 22);
  effectLines.forEach((line, i) => ctx.fillText(line, x + w / 2, cy + h - 52 + i * 18));
  if (opts.combo) {
    ctx.fillStyle = '#ff6b35';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('COMBO +2', x + w / 2, cy + h - 20);
  }
  ctx.restore();
}

/** One face-down card back for the Warden's hand. */
function drawCardBack(ctx, x, y, w, h) {
  ctx.fillStyle = '#3a2b4d';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#e8b93c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8b93c';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◆', x + w / 2, y + h / 2);
}

/** Where each player-hand card sits; selected and hovered cards lift. */
export function handCardRects(state) {
  const n = state.player.hand.length;
  const spacing = n <= 1 ? 0 : Math.min(CARD_W + 14, (1180 - CARD_W) / (n - 1));
  const total = CARD_W + spacing * (n - 1);
  const startX = (CANVAS_W - total) / 2;
  return state.player.hand.map((card, i) => {
    const lift = i === state.selected ? 20 : i === state.hovered ? 12 : 0;
    return { card, x: startX + i * spacing, y: 565, w: CARD_W, h: CARD_H, lift };
  });
}

/** The Warden's side: name, life, ember, and its face-down hand. */
function drawEnemySide(ctx, state) {
  ctx.fillStyle = '#f7f1e3';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('THE ASHEN WARDEN', 40, 48);
  drawLifeBar(ctx, 40, 70, 400, 'WARDEN', state.enemy.life);
  drawBadges(ctx, 452, 70, state.enemy.armor, state.enemy.poison);
  drawEmberPips(ctx, 700, 88, state.enemy.ember, state.enemy.emberMax);
  ctx.fillStyle = 'rgba(247, 241, 227, 0.75)';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Deck ${state.enemy.deck.length}  •  Hand ${state.enemy.hand.length}`, 700, 118);
  const n = state.enemy.hand.length;
  const bw = 74;
  const spacing = Math.min(bw + 10, 560 / Math.max(1, n));
  const startX = 640 - (bw + spacing * (n - 1)) / 2;
  for (let i = 0; i < n; i += 1) {
    drawCardBack(ctx, startX + i * spacing, 130, bw, 104);
  }
}

/** The middle of the table: turn, intent, combo, and the match log. */
function drawTableMiddle(ctx, state) {
  ctx.fillStyle = '#e8b93c';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`— TURN ${state.turn} —`, 640, 262);
  if (state.aiIntent) {
    ctx.fillStyle = '#ffb347';
    ctx.font = 'italic 19px Georgia, serif';
    ctx.fillText(state.aiIntent, 640, 292);
  }
  if (state.playedElements.length > 0) {
    const names = [...new Set(state.playedElements)].map((k) => ELEMENTS[k].name).join(', ');
    ctx.fillStyle = '#7dd956';
    ctx.font = '15px Georgia, serif';
    ctx.fillText(`Combo ready: play ${names} again this turn for +2`, 640, 318);
  }
  ctx.fillStyle = 'rgba(247, 241, 227, 0.85)';
  ctx.font = '15px Georgia, serif';
  const lines = state.log.slice(-4);
  lines.forEach((line, i) => {
    ctx.globalAlpha = 0.45 + (0.55 * (i + 1)) / lines.length;
    ctx.fillText(line, 640, 348 + i * 22);
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(247, 241, 227, 0.55)';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Keys 1–7 select  •  Enter plays  •  Esc ends turn', 640, 462);
}

/** The player's side: life, ember, hand, and the End Turn button. */
function drawPlayerSide(ctx, state) {
  drawLifeBar(ctx, 40, 505, 400, 'YOU', state.player.life);
  drawBadges(ctx, 452, 505, state.player.armor, state.player.poison);
  drawEmberPips(ctx, 700, 523, state.player.ember, state.player.emberMax);
  ctx.fillStyle = 'rgba(247, 241, 227, 0.75)';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Deck ${state.player.deck.length}  •  Hand ${state.player.hand.length} / 7`, 700, 551);
  const rects = handCardRects(state);
  for (const r of rects) {
    const affordable = r.card.def.cost <= state.player.ember;
    const combo = state.playedElements.includes(r.card.def.element);
    drawCardFace(ctx, r.card, r.x, r.y, r.w, r.h, {
      playable: affordable,
      selected: state.selected === state.player.hand.indexOf(r.card),
      lift: r.lift,
      combo,
    });
  }
  // End Turn button.
  const b = END_TURN;
  ctx.fillStyle = state.phase === 'play' ? '#ff6b35' : '#555';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN', b.x + b.w / 2, b.y + b.h / 2 + 1);
}

/** Title screen: the name, the four elements, and how to play. */
function drawTitle(ctx, state) {
  drawTableFelt(ctx);
  ctx.fillStyle = '#e8b93c';
  ctx.font = 'bold 92px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER COURT', 640, 170);
  ctx.fillStyle = '#f7f1e3';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('A card battler against the Ashen Warden', 640, 232);
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Life 30 • Ember grows 1–10 • Same element twice in a turn: +2 combo', 640, 278);
  const keys = Object.keys(ELEMENTS);
  const boxW = 250;
  const gap = 20;
  const total = keys.length * boxW + (keys.length - 1) * gap;
  keys.forEach((key, i) => {
    const el = ELEMENTS[key];
    const x = 640 - total / 2 + i * (boxW + gap);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    roundRect(ctx, x, 330, boxW, 130, 12);
    ctx.fill();
    ctx.fillStyle = el.colour;
    ctx.font = '44px Georgia, serif';
    ctx.fillText(el.glyph, x + boxW / 2, 372);
    ctx.fillStyle = '#f7f1e3';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(el.name, x + boxW / 2, 412);
    ctx.font = '15px Georgia, serif';
    ctx.fillStyle = 'rgba(247, 241, 227, 0.8)';
    ctx.fillText(el.job, x + boxW / 2, 438);
  });
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Click or press Enter to begin', 640, 540);
  ctx.fillStyle = 'rgba(247, 241, 227, 0.75)';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Mouse: click a card to select, click again to play  •  Keys 1–7, Enter, Esc', 640, 580);
  ctx.fillText('Poison seeps past armor  •  Armor soaks damage first  •  Draw past 7 burns', 640, 608);
}

/** Win / loss overlay on top of the table. */
function drawEndOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(10, 12, 8, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const won = state.phase === 'won';
  ctx.fillStyle = won ? '#ffd166' : '#e5484d';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 300);
  ctx.fillStyle = '#f7f1e3';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText(
    won ? 'The Ashen Warden falls. The court is yours.' : 'Your ember gutters out. The Warden stands.',
    640, 380,
  );
  ctx.font = '20px Georgia, serif';
  ctx.fillText(`You ${state.player.life} — ${state.enemy.life} Warden   •   Turn ${state.turn}`, 640, 430);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Click or press Enter to play again', 640, 500);
}

/** Draw the whole scene for the current state. */
export function renderGame(ctx, state) {
  if (state.phase === 'title') {
    drawTitle(ctx, state);
    return;
  }
  drawTableFelt(ctx);
  drawEnemySide(ctx, state);
  drawTableMiddle(ctx, state);
  drawPlayerSide(ctx, state);
  if (state.phase === 'won' || state.phase === 'lost') {
    drawEndOverlay(ctx, state);
  }
}
