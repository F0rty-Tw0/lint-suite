import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import chainFitsLineRule from './rule/chain-fits-line.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'chain-fits-line': chainFitsLineRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { chainFitsLineRule };

export default plugin;
