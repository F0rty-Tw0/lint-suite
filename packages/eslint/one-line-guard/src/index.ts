import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import oneLineGuardRule from './rule/one-line-guard.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'one-line-guard': oneLineGuardRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { oneLineGuardRule };

export default plugin;
