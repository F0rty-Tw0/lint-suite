import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { rxjs } from './rxjs.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: rxjs
});

describe('FEATURE: rxjs preset', () => {
  describe('GIVEN a TypeScript file', () => {
    it.each([
      ['no-async-subscribe', 0],
      ['no-unsafe-takeuntil', 2],
      ['prefer-observer', 2],
      ['finnish', 1],
      ['no-ignored-subscription', 1],
      ['no-ignored-error', 1],
      ['no-unsafe-switchmap', 2],
      ['no-unsafe-catch', 2],
      ['no-unsafe-first', 2],
      ['no-topromise', 2],
      ['throw-error', 2],
      ['no-exposed-subjects', 2],
      ['no-cyclic-action', 2],
      ['no-subscribe-handlers', 1]
    ])(
      'WHEN the config is calculated THEN @smarttools/rxjs/%s has severity %i',
      async (rule, severity) => {
        const config: unknown = await eslint.calculateConfigForFile('x.ts');

        expect(config).toHaveProperty(
          ['rules', `@smarttools/rxjs/${rule}`, 0],
          severity
        );
      }
    );
    it.each(['no-async-subscribe', 'no-unsafe-takeuntil', 'finnish'])(
      'WHEN the config is calculated THEN rxjs/%s is not configured',
      async (rule) => {
        const config: unknown = await eslint.calculateConfigForFile('x.ts');

        expect(config).not.toHaveProperty(['rules', `rxjs/${rule}`]);
      }
    );
    it('WHEN the config is calculated THEN the plugin is not registered as rxjs', async () => {
      const config: unknown = await eslint.calculateConfigForFile('x.ts');

      expect(config).not.toHaveProperty(['plugins', 'rxjs']);
    });
  });
  describe('GIVEN a spec file', () => {
    it.each(['no-ignored-subscription', 'no-subscribe-handlers'])(
      'WHEN the config is calculated THEN @smarttools/rxjs/%s is off',
      async (rule) => {
        const config: unknown =
          await eslint.calculateConfigForFile('x.spec.ts');

        expect(config).toHaveProperty(
          ['rules', `@smarttools/rxjs/${rule}`, 0],
          0
        );
      }
    );
  });
});
