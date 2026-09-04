import { configs } from '@nx/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import type { CompatibleConfigArray } from 'typescript-eslint';

const nxTypescript: CompatibleConfigArray = configs['flat/typescript'];
const nxJavascript: CompatibleConfigArray = configs['flat/javascript'];

// Keep workspace policy separate so projects with their own presets do not apply Nx defaults twice.
export const workspaceConfig = defineConfig([
  globalIgnores(['**/dist'], 'workspace/build-output'),
  {
    name: 'workspace/rules',
    files: ['**/*.ts', '**/*.js'],
    rules: {
      curly: ['error', 'multi-line'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' }
      ],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint\\.config(\\.base)?\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*']
            }
          ]
        }
      ]
    }
  }
]);

export default defineConfig(
  configs['flat/base'],
  nxTypescript,
  nxJavascript,
  workspaceConfig
);
