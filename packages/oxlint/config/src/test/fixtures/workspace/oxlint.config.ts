import {
  angular,
  defineLintSuiteConfig,
  playwright,
  recommended,
  rxjs,
  storybook,
  vitest
} from '@lint-suite/oxlint-config';

export default defineLintSuiteConfig(
  recommended,
  angular,
  rxjs,
  vitest,
  playwright,
  storybook
);
