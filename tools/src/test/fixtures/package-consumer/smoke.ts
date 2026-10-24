import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import modularBoundaries from '@lint-suite/eslint-modular-boundaries';
import { oxlintOverlap } from '@lint-suite/oxlint-config/eslint';
import * as eslintMissing from '@lint-suite/oxlint-config/eslint-missing';
import localPlugin from '@lint-suite/oxlint-config/local-plugin';
import { Linter } from 'eslint';
import engine from 'stylelint';
import * as lintSuiteEslint from 'lint-suite/eslint';
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

const workspace = join(process.cwd(), 'mb');
const featureSource = join(workspace, 'packages/feature/src');
const uiSource = join(workspace, 'packages/ui/src');
mkdirSync(featureSource, { recursive: true });
mkdirSync(uiSource, { recursive: true });
writeFileSync(
  join(workspace, 'pnpm-workspace.yaml'),
  "packages:\n  - 'packages/*'\n"
);
writeFileSync(
  join(workspace, 'packages/feature/package.json'),
  '{ "name": "@mb/feature" }\n'
);
writeFileSync(
  join(workspace, 'packages/ui/package.json'),
  '{ "name": "@mb/ui" }\n'
);
writeFileSync(join(uiSource, 'index.js'), 'export const ui = 1;\n');
const linter = new Linter({ cwd: workspace });
const boundaries = linter.verify(
  "import { ui } from '../../ui/src/index.js';\nexport { ui };\n",
  {
    files: ['**/*.js'],
    plugins: { 'modular-boundaries': modularBoundaries },
    rules: { 'modular-boundaries/modular-boundaries': 'error' }
  },
  join(featureSource, 'index.js')
);
const crossProject = boundaries.filter(
  (message) =>
    message.messageId === 'noRelativeOrAbsoluteImportsAcrossLibraries'
);
assert.equal(crossProject.length, 1);
console.log(
  'PASS: packed modular-boundaries plugin resolves yaml and typescript and reports a cross-project relative import'
);

assert.equal(localPlugin.meta?.name, 'local');
console.log(
  'PASS: packed oxlint local plugin loads without a runtime failure and names itself local'
);

const overlap = oxlintOverlap({ rules: { 'eslint/no-console': 'error' } });
const overlapRules = overlap.flatMap((block) => Object.keys(block.rules ?? {}));
assert.deepEqual(overlapRules, ['no-console']);
console.log(
  'PASS: packed oxlint ESLint overlap turns the oxlint-enabled rule off in ESLint'
);

assert.equal(eslintMissing.json, lintSuiteEslint.json);
const consoleSource = 'console.log(1);\n';
const consoleMessagesFor = (config: Linter.Config[]): string[] => {
  const messages = new Linter().verify(consoleSource, config, 'a.js');
  const ruleIds = messages.map((message) => message.ruleId ?? '');

  return ruleIds.filter((ruleId) => ruleId === 'no-console');
};
assert.deepEqual(consoleMessagesFor([...lintSuiteEslint.recommended]), [
  'no-console'
]);
assert.deepEqual(consoleMessagesFor([...eslintMissing.recommended]), []);
console.log(
  'PASS: packed eslint-missing reuses the lint-suite json array and turns off the rules oxlint runs'
);
