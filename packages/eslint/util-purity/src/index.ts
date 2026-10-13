import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import utilPurityRule from './rule/util-purity.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'util-purity': utilPurityRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { utilPurityRule };

export default plugin;
