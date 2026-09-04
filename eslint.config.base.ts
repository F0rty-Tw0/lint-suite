import { defineConfig, globalIgnores } from 'eslint/config';

export const workspaceConfig = defineConfig([
  globalIgnores(['**/dist'], 'workspace/build-output'),
  {
    name: 'workspace/rules',
    files: ['**/*.ts', '**/*.js'],
    rules: {
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
