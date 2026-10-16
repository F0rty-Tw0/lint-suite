import { defineConfig, globalIgnores } from 'eslint/config';
import {
  createTypeScriptImportResolver,
  defaultConditionNames
} from 'eslint-import-resolver-typescript';

import { workspaceConfig } from './eslint.config.base.ts';
import { base } from './packages/lint-suite/src/lib/base.ts';
import { boundaries } from './packages/lint-suite/src/lib/boundaries.ts';
import { javascript } from './packages/lint-suite/src/lib/javascript.ts';
import { prettier } from './packages/lint-suite/src/lib/prettier.ts';
import { typescript } from './packages/lint-suite/src/lib/typescript.ts';

export const packageEntryPoints = [
  '**/src/*.ts',
  '**/main.ts',
  '**/main.*.ts',
  '**/public-api.ts',
  '**/index.ts',
  '**/*.config.{ts,mts,cts}',
  '**/*.spec.ts',
  '**/*.spec.util.ts',
  '**/*.stub.ts',
  '**/*.mock.ts',
  '**/*.d.ts',
  '**/*.stories.ts',
  '**/environment*.ts'
];

const developmentResolver = createTypeScriptImportResolver({
  alwaysTryTypes: true,
  conditionNames: ['development', ...defaultConditionNames]
});

// Lint targets run with `node --conditions=development` (nx.json) so the presets load rule sources; imports resolve the same way.
export const dogfoodConfig = defineConfig(
  base,
  javascript,
  typescript,
  boundaries,
  prettier,
  workspaceConfig,
  globalIgnores(['**/fixtures/**'], 'dogfood/fixtures'),
  {
    name: 'dogfood/repo-style',
    files: ['**/*.ts'],
    settings: {
      'import-x/resolver-next': [developmentResolver]
    },
    rules: {
      'local/one-line-guard': ['error', { maxLineLength: 80 }],
      'local/no-unused-exports': ['error', { entryPoints: packageEntryPoints }]
    }
  }
);

export const sharedPackageConfig = defineConfig(dogfoodConfig, {
  name: 'dogfood/shared-package',
  files: ['**/*.ts'],
  rules: {
    // Every module is public through the package.json exports wildcard, and its importers live in other packages' programs.
    'local/no-unused-exports': 'off'
  }
});
