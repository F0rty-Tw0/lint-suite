import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import engine from 'stylelint';
import { stylelint } from 'lint-suite/stylelint';

const stylesheet = join(process.cwd(), 'card.component.scss');
writeFileSync(
  join(process.cwd(), 'card.component.html'),
  '<div class="card"></div>'
);
writeFileSync(
  stylesheet,
  '.card {\n  color: red;\n}\n.unused {\n  color: blue;\n}\n'
);
const invalid = await engine.lint({
  cwd: process.cwd(),
  files: [stylesheet],
  config: stylelint
});
const reports = invalid.results
  .flatMap((result) => result.warnings)
  .filter((warning) => warning.rule === 'lint-suite/no-unused-classes');
assert.equal(reports.length, 1);
writeFileSync(stylesheet, '.card {\n  color: red;\n}\n');
const valid = await engine.lint({
  cwd: process.cwd(),
  files: [stylesheet],
  config: stylelint
});
assert.equal(valid.errored, false);
assert.deepEqual(
  valid.results.flatMap((result) => result.warnings),
  []
);
console.log(
  'PASS: packed Stylelint preset resolves its own ESM dependencies and preserves rule behavior'
);
