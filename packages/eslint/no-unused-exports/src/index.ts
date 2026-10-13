import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noUnusedExportsRule from './rule/no-unused-exports.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-unused-exports': noUnusedExportsRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noUnusedExportsRule };

export default plugin;
