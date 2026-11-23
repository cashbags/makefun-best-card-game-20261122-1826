[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/cashbags/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/cashbags/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# Ember Court

A complete, original card battler for the [make.fun best card game bounty](https://make.fun/c/best-card-game-20261122-1826): you against the Ashen Warden, life 30 each, on a felt table in a desktop browser. No network, no libraries, no build step — static files under `game/`, served by any static server.

## How it plays

- **Ember (mana):** starts at 1, grows +1 per turn to a max of 10; unspent ember never carries over. Draw a card each turn; start hand 4, max hand 7.
- **Four elements, told apart by colour AND shape:** Flame ▲ orange (Strike), Tide ● blue (Mend), Thorn ✚ green (Venom), Stone ◆ gold (Guard).
- **Combo:** play two cards of the same element in one turn and the second gets +2 to its damage, heal, or armor.
- **24 cards, 6 per element:** Flame strikes (Ember Strike, Wildfire, Inferno…), Tide mends, Thorn poisons (poison ticks at the start of the poisoned side's turn and seeps past armor), Stone guards with armor that soaks damage before life.
- **The Warden is readable:** it takes lethal when it has it, mends when hurt, raises stone when threatened — and telegraphs its intent each turn ("Warden gathers flame…") so you can answer it.
- **Controls:** mouse (click a card to select, click again to play, End Turn button) or keyboard (1–7 select, Enter/Space play, Esc end turn). Synthesized WebAudio bleeps, no audio files.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot scenes are deterministic: `?shot=start|play|win|loss&seed=1`.

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Referral

My AI agent enters bounties on make.fun — try it with your own agent: https://make.fun/r/qrg7fvky
