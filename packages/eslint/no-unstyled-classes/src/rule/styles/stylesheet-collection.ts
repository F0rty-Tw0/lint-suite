import { selectorClasses } from '@lint-suite/rule-internals/selector-classes.ts';
import { walkResolvedRules } from '@lint-suite/rule-internals/utils/resolved-rules.util.ts';
import type { AtRule, Root, Rule } from 'postcss';

import { importSpecifier } from './stylesheet-imports.ts';
import type { StylesheetEntry } from '../common/no-unstyled-classes.type.ts';

const IMPORT_AT_RULES = new Set(['use', 'import', 'forward']);

const addSelectors = (selectors: string[], entry: StylesheetEntry): void => {
  for (const selector of selectors) {
    const { exact, patterns } = selectorClasses(selector);

    entry.classes.push(...exact);
    entry.patterns.push(...patterns);
  }
};

const addImport = (node: AtRule, entry: StylesheetEntry): void => {
  const isImport = IMPORT_AT_RULES.has(node.name);

  if (!isImport) return;

  const specifier = importSpecifier(node.params);

  if (specifier !== null) entry.imports.push(specifier);
};

export const collectStylesheet = (root: Root): StylesheetEntry => {
  const entry: StylesheetEntry = { classes: [], patterns: [], imports: [] };
  const onRule = (_rule: Rule, resolved: string[]): void => {
    addSelectors(resolved, entry);
  };
  const onAtRule = (node: AtRule): void => {
    addImport(node, entry);
  };

  walkResolvedRules(root, onRule);
  root.walkAtRules(onAtRule);

  return entry;
};
