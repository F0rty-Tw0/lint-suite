import type { DummyRuleMap, OxlintConfig } from 'oxlint';

import { BOUNDARIES_FILES, STORIES_FILES } from '../common/file-globs.const.ts';
import {
  BOUNDARIES_PLUGIN,
  MODULAR_BOUNDARIES_PLUGIN
} from '../common/js-plugin.const.ts';

const elements = [
  { type: 'feature', pattern: '**/feature/**' },
  { type: 'data-access', pattern: '**/data-access/**' },
  { type: 'domain-logic', pattern: '**/domain-logic/**' },
  { type: 'ui', pattern: '**/ui/**' },
  { type: 'common', pattern: '**/common/**' },
  { type: 'utils', pattern: '**/utils/**' }
];
const resolver = { typescript: { alwaysTryTypes: true } };
const rules: DummyRuleMap = {
  'modular-boundaries/modular-boundaries': [
    'error',
    {
      depConstraints: [
        { sourceTag: 'type:lib', notDependOnLibsWithTags: ['type:app'] },
        { sourceTag: 'type:app', notDependOnLibsWithTags: ['type:app'] },
        { sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }
      ]
    }
  ],
  'boundaries/dependencies': [
    'error',
    {
      default: 'disallow',
      message:
        '{{to.element.types}} is not allowed to be imported in {{from.element.types}}',
      policies: [
        {
          from: { element: { type: 'feature' } },
          allow: [
            { to: { element: { type: 'feature' } } },
            { to: { element: { type: 'ui' } } },
            { to: { element: { type: 'domain-logic' } } },
            { to: { element: { type: 'utils' } } },
            { to: { element: { type: 'common' } } }
          ]
        },
        {
          from: { element: { type: 'domain-logic' } },
          allow: [
            { to: { element: { type: 'domain-logic' } } },
            { to: { element: { type: 'data-access' } } },
            { to: { element: { type: 'utils' } } },
            { to: { element: { type: 'common' } } }
          ]
        },
        {
          from: { element: { type: 'data-access' } },
          allow: [
            { to: { element: { type: 'data-access' } } },
            { to: { element: { type: 'utils' } } },
            { to: { element: { type: 'common' } } }
          ]
        },
        {
          from: { element: { type: 'ui' } },
          allow: [
            { to: { element: { type: 'ui' } } },
            { to: { element: { type: 'utils' } } },
            { to: { element: { type: 'common' } } }
          ]
        },
        {
          from: { element: { type: 'utils' } },
          allow: [
            { to: { element: { type: 'utils' } } },
            { to: { element: { type: 'common' } } }
          ]
        },
        {
          from: { element: { type: 'common' } },
          allow: [{ to: { element: { type: 'common' } } }]
        }
      ]
    }
  ]
};

export const boundaries: OxlintConfig = {
  categories: { correctness: 'off' },
  jsPlugins: [BOUNDARIES_PLUGIN, MODULAR_BOUNDARIES_PLUGIN],
  settings: { 'boundaries/elements': elements, 'import/resolver': resolver },
  overrides: [
    { files: BOUNDARIES_FILES, rules },
    { files: STORIES_FILES, rules: { 'boundaries/dependencies': 'off' } }
  ]
};
