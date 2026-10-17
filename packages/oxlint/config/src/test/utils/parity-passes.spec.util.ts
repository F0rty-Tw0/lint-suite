import {
  angular as eslintAngular,
  angularTemplate as eslintAngularTemplate,
  playwright as eslintPlaywright,
  recommended as eslintRecommended,
  rxjs as eslintRxjs,
  storybook as eslintStorybook,
  vitest as eslintVitest
} from 'lint-suite/eslint';
import type { OxlintConfig } from 'oxlint';
import type { CompatibleConfigArray } from 'typescript-eslint';

import {
  angular,
  playwright,
  recommended,
  rxjs,
  storybook,
  typescriptTypeAware,
  vitest
} from '../../index.ts';
import { defineLintSuiteConfig } from '../../utils/define-lint-suite-config.util.ts';
import type { ParityPass } from '../common/parity.type.ts';

const recommendedWith = (
  name: string,
  eslint: CompatibleConfigArray,
  oxlint: OxlintConfig
): ParityPass => {
  const pass: ParityPass = {
    title: `pass 3: recommended + ${name}`,
    eslint: [...eslintRecommended, ...eslint],
    oxlint: defineLintSuiteConfig(recommended, oxlint),
    typeAware: false
  };

  return pass;
};

/** The ESLint preset combinations and their oxlint counterparts that parity compares. */
export const parityPasses = (): ParityPass[] => {
  const angularEslint = [...eslintAngular, ...eslintAngularTemplate];
  const passes: ParityPass[] = [
    {
      title: 'pass 1: recommended',
      eslint: eslintRecommended,
      oxlint: defineLintSuiteConfig(recommended),
      typeAware: false
    },
    {
      title: 'pass 2: recommended + typescriptTypeAware',
      eslint: eslintRecommended,
      oxlint: defineLintSuiteConfig(recommended, typescriptTypeAware),
      typeAware: true
    },
    recommendedWith('angular', angularEslint, angular),
    recommendedWith('rxjs', eslintRxjs, rxjs),
    recommendedWith('vitest', eslintVitest, vitest),
    recommendedWith('playwright', eslintPlaywright, playwright),
    recommendedWith('storybook', eslintStorybook, storybook)
  ];

  return passes;
};
