import type { JsPluginEntry } from './oxlint-config.type.ts';

export const ANGULAR_ESLINT_PLUGIN: JsPluginEntry = {
  name: '@angular-eslint',
  specifier: import.meta.resolve('@angular-eslint/eslint-plugin')
};

export const BOUNDARIES_PLUGIN: JsPluginEntry = {
  name: 'boundaries',
  specifier: import.meta.resolve('eslint-plugin-boundaries')
};

export const ESLINT_JS_PLUGIN: JsPluginEntry = {
  name: 'eslint-js',
  specifier: import.meta.resolve('oxlint-plugin-eslint')
};

export const LOCAL_PLUGIN: JsPluginEntry = {
  name: 'local',
  specifier: import.meta.resolve('@lint-suite/oxlint-config/local-plugin')
};

export const MODULAR_BOUNDARIES_PLUGIN: JsPluginEntry = {
  name: 'modular-boundaries',
  specifier: import.meta.resolve('@lint-suite/eslint-modular-boundaries')
};

export const NO_UNUSED_ANGULAR_FIELDS_PLUGIN: JsPluginEntry = {
  name: 'lint-suite-angular',
  specifier: import.meta.resolve('@lint-suite/eslint-no-unused-angular-fields')
};

export const PLAYWRIGHT_PLUGIN: JsPluginEntry = {
  name: 'playwright',
  specifier: import.meta.resolve('eslint-plugin-playwright')
};

export const RXJS_PLUGIN: JsPluginEntry = {
  name: '@smarttools/rxjs',
  specifier: import.meta.resolve('@smarttools/eslint-plugin-rxjs')
};

export const STORYBOOK_PLUGIN: JsPluginEntry = {
  name: 'storybook',
  specifier: import.meta.resolve('eslint-plugin-storybook')
};

export const STYLISTIC_PLUGIN: JsPluginEntry = {
  name: '@stylistic',
  specifier: import.meta.resolve('@stylistic/eslint-plugin')
};

export const JS_PLUGINS: JsPluginEntry[] = [
  ANGULAR_ESLINT_PLUGIN,
  BOUNDARIES_PLUGIN,
  ESLINT_JS_PLUGIN,
  LOCAL_PLUGIN,
  MODULAR_BOUNDARIES_PLUGIN,
  NO_UNUSED_ANGULAR_FIELDS_PLUGIN,
  PLAYWRIGHT_PLUGIN,
  RXJS_PLUGIN,
  STORYBOOK_PLUGIN,
  STYLISTIC_PLUGIN
];
