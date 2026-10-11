import { join } from 'node:path';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { angular } from './angular.ts';
import { reportedRuleIds } from './test/utils/reported-rule-ids.spec.util.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: angular
});

const code = `
import { Component, computed } from '@angular/core';

@Component({ selector: 'app-x', template: '{{ total() }}' })
export class X {
  protected readonly total = computed(() => 1);
}
`;

describe('angular', () => {
  it('reports a computed() that reads no signal', async () => {
    const filePath = join(import.meta.dirname, 'angular.spec.ts');
    const ruleIds = await reportedRuleIds(eslint, code, filePath);

    expect(ruleIds).toContain(
      '@angular-eslint/reactive-context-must-read-signal'
    );
  });
});
