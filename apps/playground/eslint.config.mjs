import baseConfig from '../../eslint.config.base.mjs';
import { base } from '../../packages/lint-suite/src/lib/base.js';
import { javascript } from '../../packages/lint-suite/src/lib/javascript.js';
import { typescript } from '../../packages/lint-suite/src/lib/typescript.js';
import { angular } from '../../packages/lint-suite/src/lib/angular.js';
import { angularTemplate } from '../../packages/lint-suite/src/lib/angular-template.js';
import { rxjs } from '../../packages/lint-suite/src/lib/rxjs.js';
import { json } from '../../packages/lint-suite/src/lib/json.js';
import { jest } from '../../packages/lint-suite/src/lib/jest.js';

export default [
  ...baseConfig,
  ...base,
  ...javascript,
  ...typescript,
  ...angularTemplate,
  ...angular,
  ...rxjs,
  ...json,
  // ...jest,
];
