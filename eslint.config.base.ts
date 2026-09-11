import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export const typescriptConfig = defineConfig(
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/fixtures/**']),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  prettier
);

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
