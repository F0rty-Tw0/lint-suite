import { ConfigArray } from 'typescript-eslint';
import { angularTemplate } from './lib/angular-template.js';
import { angular } from './lib/angular.js';
import { base } from './lib/base.js';
import { javascript } from './lib/javascript.js';
import { jest } from './lib/jest.js';
import { json } from './lib/json.js';
import { rxjs } from './lib/rxjs.js';
import { storybook } from './lib/storybook.js';
import { typescript } from './lib/typescript.js';
import { vitest } from './lib/vitest.js';
import { playwright } from './lib/playwright.js';

export const recommended: ConfigArray = [
  ...base,
  ...javascript,
  ...typescript,
  ...angular,
  ...angularTemplate,
  ...rxjs,
  ...jest,
  ...json,
  ...storybook,
  ...vitest,
  ...playwright
];

export {
  base,
  javascript,
  typescript,
  angular,
  angularTemplate,
  rxjs,
  jest,
  json,
  storybook,
  vitest,
  playwright
};
