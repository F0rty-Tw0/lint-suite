import { defineConfig } from 'eslint/config';

import { dogfoodConfig } from '../../../eslint.config.dogfood.ts';

const config = defineConfig(dogfoodConfig, {
  // Preset files are rule tables; naming every option literal would scatter each table across constants.
  name: 'oxlint-config/preset-files',
  files: ['src/lib/*.ts'],
  ignores: ['**/*.spec.ts'],
  rules: {
    'local/no-nested-object-value': 'off'
  }
});

export default config;
