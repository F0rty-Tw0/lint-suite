import { defineConfig } from 'eslint/config';

import { dogfoodConfig } from '../../../eslint.config.dogfood.ts';

const config = defineConfig(dogfoodConfig);

export default config;
