import { TmplAstElement, parseTemplate } from '@angular/compiler';

import assert from 'node:assert/strict';

import { test } from 'vitest';

import { templateClasses } from './template-classes.util.ts';
import type { TemplateClass } from '../common/class-usage.type.ts';

const elementOf = (template: string): TmplAstElement => {
  const parsed = parseTemplate(template, 'template-classes.html');
  const [node] = parsed.nodes;

  assert.ok(node instanceof TmplAstElement);

  return node;
};

const namesOf = (template: string): string[] => {
  const nameOf = (entry: TemplateClass): string => entry.name;

  return templateClasses(elementOf(template)).map(nameOf);
};

const spansOf = (template: string): number[][] => {
  const columnsOf = (entry: TemplateClass): number[] => {
    return [entry.span.start.col, entry.span.end.col];
  };

  return templateClasses(elementOf(template)).map(columnsOf);
};

test('splits a static class attribute on whitespace', () => {
  assert.deepEqual(namesOf('<div class="a  b c"></div>'), ['a', 'b', 'c']);
});

test('reads nothing from an element without a class attribute', () => {
  assert.deepEqual(namesOf('<div id="x"></div>'), []);
});

test('spans a static token at its own columns', () => {
  assert.deepEqual(spansOf('<div class="ab cd"></div>'), [
    [12, 14],
    [15, 17]
  ]);
});

test('reads the class name of a class binding', () => {
  const template = '<div [class.active]="x" [class.is-open]="y"></div>';

  assert.deepEqual(namesOf(template), ['active', 'is-open']);
});

test('spans a class binding at its key', () => {
  assert.deepEqual(spansOf('<div [class.active]="x"></div>'), [[6, 18]]);
});

test('reads literal class names of a class expression binding', () => {
  const template = `<div [class]="{ 'map-a': c }"></div>`;

  assert.deepEqual(namesOf(template), ['map-a']);
});

test('reads the literal parts of an interpolated class attribute', () => {
  const template = '<div class="s1 {{ q }} s2"></div>';

  assert.deepEqual(namesOf(template), ['s1', 's2']);
});

test('spans every expression class at the whole attribute', () => {
  assert.deepEqual(spansOf(`<div [class]="'lit-a lit-b'"></div>`), [
    [5, 28],
    [5, 28]
  ]);
});

test('reads nothing from an unrelated property binding', () => {
  assert.deepEqual(namesOf('<div [id]="x"></div>'), []);
});

test('reads nothing from an attribute binding on a class attribute', () => {
  assert.deepEqual(namesOf('<div [attr.class]="x"></div>'), []);
});

test('reads the classes of a routerLinkActive attribute and binding', () => {
  const template =
    '<a routerLinkActive="r-a r-b" [routerLinkActive]="\'r-c\'"></a>';

  assert.deepEqual(namesOf(template), ['r-a', 'r-b', 'r-c']);
});

test('reads the classes of animate.enter and animate.leave', () => {
  const template = '<div animate.enter="e-1" [animate.leave]="\'e-2\'"></div>';

  assert.deepEqual(namesOf(template), ['e-1', 'e-2']);
});
