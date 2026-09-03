import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { RuleTester } from 'eslint';
import type { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

import { angular } from '../../../angular.js';

const angularPlugin = angular
  .map((config) => config.plugins?.['lint-suite-angular'])
  .find(Boolean);
const registeredRule = angularPlugin?.rules?.['no-unused-instance-fields'];

assert.ok(
  registeredRule,
  'angular preset must register lint-suite-angular/no-unused-instance-fields'
);

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

export const rule: NonNullable<ESLint.Plugin['rules']>[string] =
  registeredRule;
export const ruleName = 'lint-suite-angular/no-unused-instance-fields';
export const parser = tseslint.parser;
export const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', parser, sourceType: 'module' }
});

export function component(
  body: string,
  metadata = "template: ''",
  imports = 'Component',
  decorator = 'Component',
  classDeclaration = 'class TestComponent'
) {
  return `import { ${imports} } from '@angular/core'; @${decorator}({ ${metadata} }) ${classDeclaration} { ${body} }`;
}
