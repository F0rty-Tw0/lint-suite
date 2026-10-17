import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { storybook } from './storybook.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: storybook
});

describe('FEATURE: storybook preset', () => {
  describe('GIVEN the Storybook main config file', () => {
    it.each([
      '.storybook/main.ts',
      '.storybook/main.js',
      '.storybook/main.cts',
      'apps/web/.storybook/main.ts',
      'libs/ui/.storybook/main.mts'
    ])(
      'WHEN the config for %s is calculated THEN storybook/no-uninstalled-addons is an error',
      async (filePath) => {
        const config: unknown = await eslint.calculateConfigForFile(filePath);

        expect(config).toHaveProperty(
          ['rules', 'storybook/no-uninstalled-addons', 0],
          2
        );
      }
    );
  });
  describe('GIVEN a stories file', () => {
    it.each([
      ['storybook/default-exports', 2],
      ['storybook/csf-component', 1],
      ['storybook/no-stories-of', 2]
    ])(
      'WHEN the config is calculated THEN %s has severity %i',
      async (ruleId, severity) => {
        const config: unknown = await eslint.calculateConfigForFile(
          'src/button.stories.ts'
        );

        expect(config).toHaveProperty(['rules', ruleId, 0], severity);
      }
    );
    it('WHEN the config is calculated THEN storybook/no-uninstalled-addons is not configured', async () => {
      const config: unknown = await eslint.calculateConfigForFile(
        'src/button.stories.ts'
      );

      expect(config).not.toHaveProperty([
        'rules',
        'storybook/no-uninstalled-addons'
      ]);
    });
  });
});
