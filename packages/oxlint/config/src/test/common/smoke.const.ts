import type { SmokeTrigger } from './smoke.type.ts';

export const SMOKE_WORKSPACE = 'workspace';

export const SMOKE_CONFIG = 'oxlint.config.ts';

export const SMOKE_ACCEPTED_STATUSES: number[] = [0, 1];

export const JS_PLUGIN_ERROR = 'Error running JS plugin';

export const ONE_LINE_GUARD_RULE = 'local/one-line-guard';

const GUARD_FILE = 'apps/shell/src/local-one-line-guard.ts';

export const SUPPRESSED_GUARD_FILE =
  'apps/shell/src/suppressed-one-line-guard.ts';

export const SMOKE_TRIGGERS: SmokeTrigger[] = [
  { rule: ONE_LINE_GUARD_RULE, file: GUARD_FILE },
  {
    rule: 'eslint-js/spaced-comment',
    file: 'apps/shell/src/eslint-js-spaced-comment.ts'
  },
  {
    rule: '@stylistic/padding-line-between-statements',
    file: 'apps/shell/src/stylistic-padding-line.ts'
  },
  {
    rule: 'boundaries/dependencies',
    file: 'libs/shared/src/ui/boundaries.ts'
  },
  {
    rule: 'modular-boundaries/modular-boundaries',
    file: 'libs/shared/src/modular-boundaries.ts'
  },
  {
    rule: '@angular-eslint/prefer-output-readonly',
    file: 'apps/shell/src/angular.component.ts'
  },
  {
    rule: 'lint-suite-angular/no-unused-angular-fields',
    file: 'apps/shell/src/angular.component.ts'
  },
  {
    rule: '@smarttools/rxjs/no-sharereplay',
    file: 'apps/shell/src/rxjs-no-sharereplay.ts'
  },
  {
    rule: 'playwright/no-wait-for-timeout',
    file: 'apps/shell/src/playwright-no-wait-for-timeout.e2e.ts'
  },
  {
    rule: 'storybook/no-stories-of',
    file: 'apps/shell/src/storybook-no-stories-of.stories.ts'
  }
];
