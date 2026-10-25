import {
  angular,
  defineLintSuiteConfig,
  recommended
} from '@lint-suite/oxlint-config';
import type { OxlintConfig } from 'oxlint';

const keptOff: OxlintConfig = {
  rules: {
    'local/no-call-in-condition': 'off',
    'lint-suite-angular/no-unused-angular-fields': 'off'
  }
};

export default defineLintSuiteConfig(recommended, angular, keptOff);
