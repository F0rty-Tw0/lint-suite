import assert from 'node:assert/strict';

import type { Rule } from 'postcss';
import { parse } from 'postcss-scss';
import { test } from 'vitest';

import { walkResolvedRules } from './resolved-rules.util.ts';

type VisitedRule = {
  readonly selector: string;
  readonly resolved: string[];
  readonly parents: string[];
};

const visitedRules = (source: string): VisitedRule[] => {
  const rules: VisitedRule[] = [];
  const record = (rule: Rule, resolved: string[], parents: string[]): void => {
    const visited: VisitedRule = { selector: rule.selector, resolved, parents };

    rules.push(visited);
  };

  walkResolvedRules(parse(source), record);

  return rules;
};

test('visits a top level rule without a parent', () => {
  const card: VisitedRule = {
    selector: '.card',
    resolved: ['.card'],
    parents: []
  };

  assert.deepEqual(visitedRules('.card {}'), [card]);
});

test('resolves a nested rule against its parent', () => {
  const panel: VisitedRule = {
    selector: '.panel',
    resolved: ['.panel'],
    parents: []
  };
  const header: VisitedRule = {
    selector: '&__header',
    resolved: ['.panel__header'],
    parents: ['.panel']
  };

  assert.deepEqual(visitedRules('.panel { &__header {} }'), [panel, header]);
});

test('keeps the parent of a rule nested inside an at-rule', () => {
  const source = '.panel { @media (min-width: 1px) { &__body {} } }';
  const body: VisitedRule = {
    selector: '&__body',
    resolved: ['.panel__body'],
    parents: ['.panel']
  };

  assert.deepEqual(visitedRules(source).at(1), body);
});

test('passes every member of a selector list to the children', () => {
  const suffix: VisitedRule = {
    selector: '&__x',
    resolved: ['.a__x', '.b__x'],
    parents: ['.a', '.b']
  };

  assert.deepEqual(visitedRules('.a, .b { &__x {} }').at(1), suffix);
});
