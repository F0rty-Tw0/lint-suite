import { join } from 'node:path';

import stylelintApi from 'stylelint';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import { stylelint } from './stylelint.ts';

describe('stylelint', () => {
  it('reports a selector that can never match', async () => {
    const templateWalkRoot = import.meta.dirname;
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(templateWalkRoot);

    onTestFinished(() => cwd.mockRestore());

    const codeFilename = join(templateWalkRoot, 'x.scss');
    const options = {
      code: '.a :is(.b::before) {\n  color: red;\n}\n',
      codeFilename,
      config: stylelint
    };
    const { results } = await stylelintApi.lint(options);
    const warnings = results[0]?.warnings ?? [];
    const rules = warnings.map((warning) => warning.rule);

    expect(rules).toContain('selector-no-unmatchable');
  });
});
