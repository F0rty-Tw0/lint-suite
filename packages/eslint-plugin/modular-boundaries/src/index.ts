import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import modularBoundariesRule from './rule/modular-boundaries.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'modular-boundaries': modularBoundariesRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { modularBoundariesRule };

export default plugin;
