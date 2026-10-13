import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noGroupedConditionRule from './rule/no-grouped-condition.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-grouped-condition': noGroupedConditionRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noGroupedConditionRule };

export default plugin;
