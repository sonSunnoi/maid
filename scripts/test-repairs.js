#!/usr/bin/env node
/* eslint-disable no-console */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { repairCandidates } = await import(path.join(root, 'out', 'index.js'));
const dir = path.join(root, 'test-fixtures', 'repairs');

// Row = { name, level, before, after }; after is null when the rule must not fire.
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).sort();
assert.ok(files.length > 0, `no repair fixtures in ${dir}`);

let failed = 0;
for (const file of files) {
  const rule = file.replace(/\.jsonl$/, '');
  const rows = fs.readFileSync(path.join(dir, file), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  let passed = 0;
  for (const row of rows) {
    const candidates = repairCandidates(row.before, { level: row.level });
    const mine = candidates.filter(c => c.rule === rule);
    try {
      if (row.after === null) {
        assert.deepStrictEqual(mine, [], 'rule fired on a negative row');
      } else {
        assert.ok(mine.length > 0, `no ${rule} candidate (got: ${candidates.map(c => c.rule).join(', ') || 'none'})`);
        assert.ok(mine.some(c => c.text === row.after), `candidate text differs:\n${JSON.stringify(mine.map(c => c.text))}\nexpected:\n${JSON.stringify(row.after)}`);
      }
      passed++;
    } catch (error) {
      failed++;
      console.error(`FAIL ${rule} :: ${row.name}\n  ${error.message.replace(/\n/g, '\n  ')}`);
    }
  }
  console.log(`${rule}: ${passed}/${rows.length} rows passed`);
}
if (failed) {
  console.error(`${failed} repair row(s) failed`);
  process.exit(1);
}
console.log(`${files.length} rule files passed`);
