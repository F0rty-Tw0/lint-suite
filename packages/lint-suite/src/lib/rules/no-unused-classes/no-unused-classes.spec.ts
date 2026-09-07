import assert from 'node:assert/strict';

import stylelintApi from 'stylelint';
import type { Config, LinterOptions, Plugin, Warning } from 'stylelint';
import { test } from 'vitest';

import type { RuleOptions } from './common/no-unused-classes.type.ts';
import plugin, { messages, ruleName } from './no-unused-classes.ts';
import { fixtureCase } from './test/utils/fixture-stylesheet.spec.util.ts';
import { stylelint as preset } from '../../../stylelint.ts';

type PresetOverride = NonNullable<Config['overrides']>[number];

type PresetPlugin = string | Plugin;

type FixtureRun = {
  readonly name: string;
  readonly file: string;
  readonly options?: RuleOptions;
};

const configFor = (options: RuleOptions | undefined): Config => {
  const bareSettings = [true];
  const configuredSettings = [true, options];
  const settings = options === undefined ? bareSettings : configuredSettings;
  const rules = { [ruleName]: settings };
  const plugins = [plugin];
  const config: Config = { customSyntax: 'postcss-scss', plugins, rules };

  return config;
};

const warningsOf = async (run: FixtureRun): Promise<Warning[]> => {
  const testCase = fixtureCase(run.name, run.file);
  const config = configFor(run.options);
  const options: LinterOptions = { ...testCase, config };
  const { results } = await stylelintApi.lint(options);
  const [first] = results;

  assert.ok(first);
  assert.deepEqual(first.invalidOptionWarnings, []);

  return first.warnings;
};

const presetPlugins = (override: PresetOverride): PresetPlugin[] => {
  const { plugins } = override;

  if (!Array.isArray(plugins)) return [];

  return plugins;
};

const textsOf = (warnings: Warning[]): string[] => {
  return warnings.map((warning) => warning.text);
};

test('reports a class that no template of the stylesheet uses', async () => {
  const warnings = await warningsOf({
    name: 'flat',
    file: 'card.component.scss'
  });

  assert.deepEqual(textsOf(warnings), [messages.rejected('unused')]);
});

test('reports nested selectors on the rule that declares them', async () => {
  const warnings = await warningsOf({
    name: 'nested',
    file: 'panel.component.scss'
  });
  const lines = warnings.map((warning) => warning.line);

  assert.deepEqual(textsOf(warnings), [
    messages.rejected('hover-child'),
    messages.rejected('b__x')
  ]);
  assert.deepEqual(lines, [26, 33]);
});

test('skips a nesting wrapper that emits no selector of its own', async () => {
  const warnings = await warningsOf({
    name: 'wrapper',
    file: 'dialog.component.scss'
  });

  assert.deepEqual(textsOf(warnings), [
    messages.rejected('shell'),
    messages.rejected('inner')
  ]);
});

test('accepts host, host-context, and ng-deep selectors', async () => {
  const warnings = await warningsOf({
    name: 'host',
    file: 'dialog.component.scss'
  });

  assert.deepEqual(textsOf(warnings), []);
});

test('accepts a class only reached through an extend', async () => {
  const warnings = await warningsOf({
    name: 'extend',
    file: 'button.component.scss'
  });

  assert.deepEqual(textsOf(warnings), []);
});

test('unions the templates of every component sharing a stylesheet', async () => {
  const warnings = await warningsOf({ name: 'shared', file: 'shared.scss' });

  assert.deepEqual(textsOf(warnings), [messages.rejected('nope')]);
});

test('reads the inline template of the owning component', async () => {
  const warnings = await warningsOf({
    name: 'inline-template',
    file: 'banner.component.scss'
  });

  assert.deepEqual(textsOf(warnings), [messages.rejected('b')]);
});

test('reports nothing when a template class source is dynamic', async () => {
  const warnings = await warningsOf({
    name: 'dynamic',
    file: 'grid.component.scss'
  });

  assert.deepEqual(textsOf(warnings), []);
});

test('treats an interpolated class token as a pattern', async () => {
  const warnings = await warningsOf({
    name: 'interpolation',
    file: 'badge.component.scss'
  });

  assert.deepEqual(textsOf(warnings), [messages.rejected('other')]);
});

test('reports nothing for a partial no component declares', async () => {
  const warnings = await warningsOf({ name: 'partial', file: '_tokens.scss' });

  assert.deepEqual(textsOf(warnings), []);
});

test('falls back to the sibling template of the stylesheet', async () => {
  const warnings = await warningsOf({
    name: 'sibling',
    file: 'note.component.scss'
  });

  assert.deepEqual(textsOf(warnings), [messages.rejected('nope')]);
});

test('falls back to the templates that link the stylesheet', async () => {
  const warnings = await warningsOf({ name: 'linked', file: 'theme.css' });

  assert.deepEqual(textsOf(warnings), [messages.rejected('nope')]);
});

test('finds the template in another directory that links the stylesheet', async () => {
  const warnings = await warningsOf({
    name: 'linked-elsewhere',
    file: 'styles/theme.css'
  });

  assert.deepEqual(textsOf(warnings), [messages.rejected('nope')]);
});

test('ignores framework prefixes by default', async () => {
  const warnings = await warningsOf({
    name: 'ignored',
    file: 'hooks.component.scss'
  });

  assert.deepEqual(textsOf(warnings), []);
});

test('replaces the default ignore patterns with the configured ones', async () => {
  const options: RuleOptions = { ignoreClassPatterns: ['^nope$'] };
  const warnings = await warningsOf({
    name: 'ignored',
    file: 'hooks.component.scss',
    options
  });

  assert.deepEqual(textsOf(warnings), [messages.rejected('mat-button')]);
});

test('the shared stylelint preset registers and enables the rule', () => {
  const [override] = preset.overrides ?? [];

  assert.ok(override);
  assert.equal(presetPlugins(override).includes(plugin), true);
  assert.equal(override.rules?.[ruleName], true);
});
