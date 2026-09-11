import selectorParser from 'postcss-selector-parser';
import type { Node } from 'postcss-selector-parser';

import type {
  ClassMatcher,
  SelectorClasses
} from './common/class-usage.type.ts';

type SelectorClassNode = { readonly value: string };

const INTERPOLATION_TOKEN = 'zzinterpzz';
const PARENT_TOKEN = 'zzparentzz';
const UNKNOWN_PARENT_SELECTOR = `.${PARENT_TOKEN}`;
const UNKNOWN_PARTS = new RegExp(
  `${INTERPOLATION_TOKEN}|${PARENT_TOKEN}`,
  'gu'
);
const INTERPOLATION = /#\{[^}]*\}/gu;
const DEEP_COMBINATORS = new Set(['/deep/', '>>>']);
const HOST_PSEUDOS = new Set([':host', ':host-context']);
const NG_DEEP_PSEUDO = '::ng-deep';
const REGEXP_META = /[.*+?^${}()|[\]\\]/gu;

const escapeRegExp = (part: string): string => {
  return part.replaceAll(REGEXP_META, '\\$&');
};

export const classNamePattern = (value: string): string => {
  const literals = value.split(UNKNOWN_PARTS).map(escapeRegExp);
  const joined = literals.join('.*');

  return `^${joined}$`;
};

const withoutParent = (selector: string): string => {
  return selector.replaceAll('&', UNKNOWN_PARENT_SELECTOR);
};

const withParent = (selector: string, parent: string): string => {
  const hasNesting = selector.includes('&');

  if (hasNesting) return selector.replaceAll('&', parent);

  return `${parent} ${selector}`;
};

export const resolveSelectors = (
  selectors: string[],
  parents: string[]
): string[] => {
  const hasParents = parents.length > 0;

  if (!hasParents) return selectors.map(withoutParent);

  const resolved: string[] = [];

  for (const parent of parents) {
    for (const selector of selectors) {
      resolved.push(withParent(selector, parent));
    }
  }

  return resolved;
};

export const selectorClasses = (selector: string): SelectorClasses => {
  const exact: string[] = [];
  const patterns: string[] = [];
  const normalized = selector.replaceAll(INTERPOLATION, INTERPOLATION_TOKEN);

  const collect = (node: SelectorClassNode): void => {
    const isBareParent = node.value === PARENT_TOKEN;

    if (isBareParent) return;

    const hasInterpolation = node.value.includes(INTERPOLATION_TOKEN);
    const hasUnknownParent = node.value.includes(PARENT_TOKEN);
    const isDynamic = hasInterpolation || hasUnknownParent;

    if (isDynamic) {
      patterns.push(classNamePattern(node.value));

      return;
    }

    exact.push(node.value);
  };

  try {
    const root = selectorParser().astSync(normalized);

    root.walkClasses(collect);
  } catch {
    const empty: SelectorClasses = { exact: [], patterns: [] };

    return empty;
  }

  const classes: SelectorClasses = { exact, patterns };

  return classes;
};

const isBoundaryNode = (node: Node): boolean => {
  if (node.type === 'combinator') return DEEP_COMBINATORS.has(node.value);

  if (node.type !== 'pseudo') return false;

  return node.value === NG_DEEP_PSEUDO;
};

const addTemplateClass = (value: string, names: string[]): void => {
  const hasInterpolation = value.includes(INTERPOLATION_TOKEN);
  const hasUnknownParent = value.includes(PARENT_TOKEN);
  const isDynamic = hasInterpolation || hasUnknownParent;

  if (isDynamic) return;

  names.push(value);
};

const collectTemplateClasses = (nodes: Node[], names: string[]): boolean => {
  for (const node of nodes) {
    const isBoundary = isBoundaryNode(node);

    if (isBoundary) return true;

    if (node.type === 'class') {
      addTemplateClass(node.value, names);
      continue;
    }

    if (node.type !== 'pseudo') continue;

    const isHost = HOST_PSEUDOS.has(node.value);

    if (isHost) continue;

    for (const argument of node.nodes) {
      const isStopped = collectTemplateClasses(argument.nodes, names);

      if (isStopped) return true;
    }
  }

  return false;
};

export const selectorTemplateClasses = (selector: string): string[] => {
  const names: string[] = [];
  const normalized = selector.replaceAll(INTERPOLATION, INTERPOLATION_TOKEN);

  try {
    const root = selectorParser().astSync(normalized);

    for (const each of root.nodes) collectTemplateClasses(each.nodes, names);
  } catch {
    return [];
  }

  const uniqueNames = new Set(names);

  return [...uniqueNames];
};

export const classMatcher = (
  exact: Set<string>,
  patterns: RegExp[]
): ClassMatcher => {
  const matches = (name: string): boolean => {
    const isExact = exact.has(name);

    if (isExact) return true;

    return patterns.some((pattern) => pattern.test(name));
  };

  return matches;
};
