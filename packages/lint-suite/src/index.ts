import { ConfigArray } from 'typescript-eslint';
import { angularTemplate } from './lib/angular-template.js';
import { angular } from './lib/angular.js';
import { base } from './lib/base.js';
import { javascript } from './lib/javascript.js';
import { jest } from './lib/jest.js';
import { json } from './lib/json.js';
import { prettier } from './lib/prettier.js';
import { rxjs } from './lib/rxjs.js';
import { storybook } from './lib/storybook.js';
import { typescript } from './lib/typescript.js';
import { vitest } from './lib/vitest.js';
import { playwright } from './lib/playwright.js';
import { boundaries } from './lib/boundaries.js';

export const recommended: ConfigArray = [
  ...base,
  ...javascript,
  ...typescript,
  ...angular,
  ...angularTemplate,
  ...rxjs,
  ...jest,
  ...json,
  ...boundaries,
  ...storybook,
  ...vitest,
  ...playwright,
  ...prettier // Must be last to disable formatting rules that conflict with Prettier
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
  boundaries,
  storybook,
  vitest,
  playwright,
  prettier
};
