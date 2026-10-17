import { describe, expect, it } from 'vitest';

import { readMissing } from './missing-table.spec.util.ts';
import { MISSING_TABLE_STUB } from '../stubs/missing.stub.ts';

const MARKDOWN_LINES = [
  '# Missing rules',
  '',
  '## Needs type info, no oxlint path',
  '',
  '| Rule | Tracker |',
  '| ---- | ------- |',
  '| `rxjs/no-ignored-error` | oxc#19596 |',
  '| `local/no-unused-exports` | oxc#19596 |',
  '',
  '## Type-aware only',
  '',
  '| Rule | Tracker |',
  '| ---- | ------- |',
  '| `@typescript-eslint/await-thenable` | — |',
  '',
  '## Option deviations',
  '',
  '| Rule | ESLint options |',
  '| ---- | -------------- |',
  "| `lint-suite-angular/no-unused-angular-fields` | `{ analysis: 'project' }` |",
  '',
  '## Behaviour gaps',
  '',
  'Prose mentioning `local/no-call-in-condition` is not a table row.'
];

const MARKDOWN = MARKDOWN_LINES.join('\n');

const DUPLICATE_MARKDOWN_LINES = [
  '## Type-aware only',
  '| Rule | Tracker |',
  '| `@typescript-eslint/await-thenable` | — |',
  '## Needs type info, no oxlint path',
  '| Rule | Tracker |',
  '| `@typescript-eslint/await-thenable` | oxc#19596 |'
];

const DUPLICATE_MARKDOWN = DUPLICATE_MARKDOWN_LINES.join('\r\n');

const SCOPED_MARKDOWN_LINES = [
  '## Angular templates',
  '| Rule | Tracker | Scope |',
  '| ---- | ------- | ----- |',
  '| `max-lines` | oxc#21936 | `.html` |',
  '| `@angular-eslint/template/alt-text` | oxc#21936 | |',
  '## JSON',
  '| Rule | Tracker |',
  '| ---- | ------- |',
  '| `json/no-empty-keys` | oxc#18656 |'
];

const SCOPED_MARKDOWN = SCOPED_MARKDOWN_LINES.join('\n');

describe('FEATURE: read MISSING.md tables', () => {
  describe('GIVEN cause tables and an option deviations table', () => {
    it('WHEN a rule row is read THEN it maps to the heading of its table', () => {
      const table = readMissing(MARKDOWN);
      const causes = Object.fromEntries(table.causes);

      expect(causes).toEqual({
        'rxjs/no-ignored-error': 'Needs type info, no oxlint path',
        'local/no-unused-exports': 'Needs type info, no oxlint path',
        '@typescript-eslint/await-thenable': 'Type-aware only'
      });
    });

    it('WHEN the option deviations table is read THEN its rules are deviations', () => {
      const table = readMissing(MARKDOWN);
      const deviations = Array.from(table.deviations);

      expect(deviations).toEqual([
        'lint-suite-angular/no-unused-angular-fields'
      ]);
    });

    it('WHEN the option deviations table is read THEN its rules are not causes', () => {
      const table = readMissing(MARKDOWN);
      const rule = 'lint-suite-angular/no-unused-angular-fields';

      const isCause = table.causes.has(rule);

      expect(isCause).toBe(false);
    });

    it('WHEN no rule is listed twice THEN there are no duplicates', () => {
      const table = readMissing(MARKDOWN);

      expect(table.duplicates).toEqual(new Map());
    });
  });

  describe('GIVEN a rule listed under two causes', () => {
    it('WHEN the tables are read THEN the rule is reported with both headings', () => {
      const table = readMissing(DUPLICATE_MARKDOWN);
      const duplicates = Object.fromEntries(table.duplicates);

      expect(duplicates).toEqual({
        '@typescript-eslint/await-thenable': [
          'Type-aware only',
          'Needs type info, no oxlint path'
        ]
      });
    });

    it('WHEN the tables are read THEN the rule maps to its first heading', () => {
      const table = readMissing(DUPLICATE_MARKDOWN);

      const cause = table.causes.get('@typescript-eslint/await-thenable');

      expect(cause).toBe('Type-aware only');
    });
  });

  describe('GIVEN a table with a Scope column', () => {
    it('WHEN a row names a scope THEN only that rule is scoped', () => {
      const table = readMissing(SCOPED_MARKDOWN);
      const scopes = Object.fromEntries(table.scopes);

      expect(scopes).toEqual({
        'max-lines': '.html'
      });
    });

    it('WHEN a row leaves the scope empty or its table has no Scope column THEN the rule is still a cause', () => {
      const table = readMissing(SCOPED_MARKDOWN);
      const causes = Object.fromEntries(table.causes);

      expect(causes).toEqual({
        'max-lines': 'Angular templates',
        '@angular-eslint/template/alt-text': 'Angular templates',
        'json/no-empty-keys': 'JSON'
      });
    });
  });

  describe('GIVEN empty markdown', () => {
    it('WHEN it is read THEN the table is empty', () => {
      const table = readMissing('');

      expect(table).toEqual(MISSING_TABLE_STUB);
    });
  });
});
