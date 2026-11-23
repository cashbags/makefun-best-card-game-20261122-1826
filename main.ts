// main.ts — the hand-in program for the Ember Court entry.
//
// This file runs on Node 22 with only the standard library. It gathers
// the two folders that make up the entry — game/ (the playable static
// files) and screenshots/ (the four real browser captures) — into the
// output directory the grader reads, then asks the vendored make.fun
// library to write the dossier the judge reads. Outside the grader's
// container the MAKEFUN_OUTPUT_DIR variable stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The copy is a plain recursive copy, so running it twice over the same
// inputs writes the same bytes twice: the grader's determinism check.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps the sealed scorer enforces: the dossier text budget, the screenshot
// count and size, and the game tree's file count, byte total, and path
// length. These numbers mirror the gate so a local run fails the same way
// the grader would.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
