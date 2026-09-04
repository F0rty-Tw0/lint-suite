import type { ConfigArray } from 'typescript-eslint';

import { angularTemplate } from './lib/angular-template.ts';
import { angular } from './lib/angular.ts';
import { base } from './lib/base.ts';
import { boundaries } from './lib/boundaries.ts';
import { javascript } from './lib/javascript.ts';
import { json } from './lib/json.ts';
import { playwright } from './lib/playwright.ts';
import { prettier } from './lib/prettier.ts';
import { rxjs } from './lib/rxjs.ts';
import { storybook } from './lib/storybook.ts';
import { typescript } from './lib/typescript.ts';
import { vitest } from './lib/vitest.ts';

export const recommended: ConfigArray = [
  ...base,
  ...javascript,
  ...typescript,
  ...json,
  ...boundaries,
  ...prettier // Must be last to disable formatting rules that conflict with Prettier
];

export {
  base,
  javascript,
  typescript,
  angular,
  angularTemplate,
  rxjs,
  json,
  boundaries,
  storybook,
  vitest,
  playwright,
  prettier
};
