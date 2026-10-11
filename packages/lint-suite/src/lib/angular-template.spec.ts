import { join } from 'node:path';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { angularTemplate } from './angular-template.ts';
import { reportedRuleIds } from './test/utils/reported-rule-ids.spec.util.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: angularTemplate
});

describe('angularTemplate', () => {
  it('reports ngStyle in favor of a [style] binding', async () => {
    const filePath = join(import.meta.dirname, 'x.component.html');
    const code = '<p [ngStyle]="styles">x</p>';
    const ruleIds = await reportedRuleIds(eslint, code, filePath);

    expect(ruleIds).toContain('@angular-eslint/template/prefer-style-binding');
  });
});
