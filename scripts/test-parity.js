#!/usr/bin/env node
/* eslint-disable no-console */
// Compares repairCandidates with an external reference implementation, row by row.
//   PARITY_FIXTURE   JSONL file; each row has `original` (or `before`) diagram text
//   PARITY_REFERENCE module path exporting localCandidates(source, level) -> string[]
// Neither file is part of this repository; the check is skipped when either is unset.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const fixture = process.env.PARITY_FIXTURE;
const reference = process.env.PARITY_REFERENCE;
if (!fixture || !reference) {
  console.log('parity: skipped (set PARITY_FIXTURE and PARITY_REFERENCE to compare against a reference implementation)');
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { repairCandidates } = await import(path.join(root, 'out', 'index.js'));
const { localCandidates } = await import(pathToFileURL(path.resolve(reference)).href);

const ordered = (source, texts) => [...new Set(texts)].filter(t => t !== source);
const rows = fs.readFileSync(fixture, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
let differing = 0;
for (const row of rows) {
  const source = row.original ?? row.before;
  for (const level of ['safe', 'all']) {
    const mine = ordered(source, repairCandidates(source, { level }).map(c => c.text));
    const theirs = ordered(source, await localCandidates(source, level));
    if (JSON.stringify(mine) !== JSON.stringify(theirs)) {
      differing++;
      console.error(`DIFF ${row.name} @${level}\n  maid:      ${JSON.stringify(mine)}\n  reference: ${JSON.stringify(theirs)}`);
    }
  }
}
console.log(`parity: ${rows.length} rows x 2 levels, ${differing} differing`);
process.exit(differing ? 1 : 0);
