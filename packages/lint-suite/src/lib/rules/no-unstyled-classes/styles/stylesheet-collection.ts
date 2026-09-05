import type { AtRule, Root, Rule } from 'postcss';

import { resolveStylesheetImport } from './stylesheet-imports.ts';
import { walkResolvedRules } from '../../utils/resolved-rules.util.ts';
import { selectorClasses } from '../../utils/selector-classes.util.ts';
import type { StylesheetEntry } from '../common/no-unstyled-classes.type.ts';

const IMPORT_AT_RULES = new Set(['use', 'import', 'forward']);

const addSelectors = (selectors: string[], entry: StylesheetEntry): void => {
  for (const selector of selectors) {
    const { exact, patterns } = selectorClasses(selector);

    entry.classes.push(...exact);
    entry.patterns.push(...patterns);
  }
};

const addImport = (
  node: AtRule,
  entry: StylesheetEntry,
  directory: string
): void => {
  const isImport = IMPORT_AT_RULES.has(node.name);

  if (!isImport) return;

  const imported = resolveStylesheetImport(node.params, directory);

  if (imported !== null) entry.imports.push(imported);
};

export const collectStylesheet = (
  root: Root,
  directory: string
): StylesheetEntry => {
  const entry: StylesheetEntry = { classes: [], patterns: [], imports: [] };
  const onRule = (_rule: Rule, resolved: string[]): void => {
    addSelectors(resolved, entry);
  };
  const onAtRule = (node: AtRule): void => {
    addImport(node, entry, directory);
  };

  walkResolvedRules(root, onRule);
  root.walkAtRules(onAtRule);

  return entry;
};
