import type { AtRule, Root, Rule } from 'postcss';
import stylelint from 'stylelint';
import type { Plugin, PostcssResult, Problem, RuleMeta } from 'stylelint';

import type { RuleOptions } from './common/no-unused-classes.type.ts';
import { stylesheetTemplates } from './styles/stylesheet-components.ts';
import { templateUsage } from './template/template-usage.ts';
import type { ClassMatcher } from '../common/class-usage.type.ts';
import { walkResolvedRules } from '../utils/resolved-rules.util.ts';
import { selectorTemplateClasses } from '../utils/selector-classes.util.ts';

type StylesheetWalker = (root: Root, result: PostcssResult) => void;

type UnusedContext = {
  readonly result: PostcssResult;
  readonly ignored: RegExp[];
  readonly extended: Set<string>;
  readonly isUsed: ClassMatcher;
};

const { createPlugin, utils } = stylelint;

const DEFAULT_IGNORE_PATTERNS = ['^(js|qa|mat|cdk|mdc)-'];

export const ruleName = 'lint-suite/no-unused-classes';

const rejected = (name: string): string => {
  return `Unexpected class ".${name}" not used by any template of this stylesheet`;
};

export const messages = utils.ruleMessages(ruleName, { rejected });

const meta: RuleMeta = {
  url: 'https://github.com/F0rty-Tw0/lint-suite#no-unused-classes'
};

const isString = (value: unknown): boolean => typeof value === 'string';

const toRegExp = (pattern: string): RegExp => new RegExp(pattern, 'u');

const validate = (
  result: PostcssResult,
  primary: true,
  secondary: RuleOptions | undefined
): boolean => {
  const primaryOptions = { actual: primary, possible: [true] };
  const possible = { ignoreClassPatterns: [isString] };
  const secondaryOptions = { actual: secondary, possible, optional: true };

  return utils.validateOptions(
    result,
    ruleName,
    primaryOptions,
    secondaryOptions
  );
};

const addNames = (selector: string, names: Set<string>): void => {
  for (const name of selectorTemplateClasses(selector)) names.add(name);
};

const extendedClasses = (root: Root): Set<string> => {
  const names = new Set<string>();
  const collect = (atRule: AtRule): void => addNames(atRule.params, names);

  root.walkAtRules('extend', collect);

  return names;
};

const ruleClasses = (resolved: string[], parents: string[]): string[] => {
  const inherited = new Set<string>();

  for (const parent of parents) addNames(parent, inherited);

  const own = new Set<string>();

  for (const selector of resolved) {
    for (const name of selectorTemplateClasses(selector)) {
      const isInherited = inherited.has(name);

      if (isInherited) continue;

      own.add(name);
    }
  }

  return [...own];
};

const reportUnused = (
  context: UnusedContext,
  rule: Rule,
  name: string
): void => {
  const matchesIgnored = (pattern: RegExp): boolean => pattern.test(name);
  const isIgnored = context.ignored.some(matchesIgnored);

  if (isIgnored) return;

  const isUsed = context.isUsed(name);

  if (isUsed) return;

  const isExtended = context.extended.has(name);

  if (isExtended) return;

  const message = messages.rejected(name);
  const word = `.${name}`;
  const problem: Problem = {
    ruleName,
    result: context.result,
    node: rule,
    message,
    word
  };

  utils.report(problem);
};

const noUnusedClasses = (
  primary: true,
  secondary: RuleOptions | undefined
): StylesheetWalker => {
  const walk = (root: Root, result: PostcssResult): void => {
    const isValid = validate(result, primary, secondary);

    if (!isValid) return;

    const file = root.source?.input.file;

    if (file === undefined) return;

    const templates = stylesheetTemplates(file);

    if (templates.length === 0) return;

    const usage = templateUsage(templates);

    if (usage.isDynamic) return;

    const patterns = secondary?.ignoreClassPatterns ?? DEFAULT_IGNORE_PATTERNS;
    const ignored = patterns.map(toRegExp);
    const extended = extendedClasses(root);
    const context: UnusedContext = {
      result,
      ignored,
      extended,
      isUsed: usage.has
    };
    const visit = (rule: Rule, resolved: string[], parents: string[]): void => {
      for (const name of ruleClasses(resolved, parents)) {
        reportUnused(context, rule, name);
      }
    };

    walkResolvedRules(root, visit);
  };

  return walk;
};

noUnusedClasses.ruleName = ruleName;
noUnusedClasses.messages = messages;
noUnusedClasses.meta = meta;

const plugin: Plugin = createPlugin(ruleName, noUnusedClasses);

export default plugin;
