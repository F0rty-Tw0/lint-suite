import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noCallInConditionRule from './rule/no-call-in-condition.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-call-in-condition': noCallInConditionRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noCallInConditionRule };

export default plugin;
