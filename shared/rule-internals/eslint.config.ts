import { defineConfig } from 'eslint/config';

import { sharedPackageConfig } from '../../eslint.config.dogfood.ts';

const config = defineConfig(sharedPackageConfig);

export default config;
