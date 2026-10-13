import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import maxConditionOperandsRule from './rule/max-condition-operands.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'max-condition-operands': maxConditionOperandsRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { maxConditionOperandsRule };

export default plugin;
