import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import arrowFitsLineRule from './rule/arrow-fits-line.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'arrow-fits-line': arrowFitsLineRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { arrowFitsLineRule };

export default plugin;
