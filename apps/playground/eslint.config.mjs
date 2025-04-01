import {
  base,
  javascript,
  angular,
  angularTemplate,
  typescript,
  rxjs,
} from '../../dist/packages/lint-suite/src/index.mjs';
import baseConfig from '../../eslint.config.base.mjs';

export default [
  ...baseConfig,
  ...base,
  ...javascript,
  ...typescript,
  ...angularTemplate,
  ...angular,
  ...rxjs,
];
