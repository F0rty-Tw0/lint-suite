import { defineConfig } from 'eslint/config';

import { typescriptConsistency } from './typescript-consistency.ts';
import { typescriptImports } from './typescript-imports.ts';
import { typescriptOverrides } from './typescript-overrides.ts';
import { typescriptRecommended } from './typescript-recommended.ts';
import { typescriptSafety } from './typescript-safety.ts';

export { localPlugin } from './typescript-local-plugin.ts';

export const typescript = defineConfig([
  ...typescriptRecommended,
  ...typescriptSafety,
  ...typescriptConsistency,
  ...typescriptImports,
  ...typescriptOverrides
]);
