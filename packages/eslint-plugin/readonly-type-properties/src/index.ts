import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import readonlyTypePropertiesRule from './rule/readonly-type-properties.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'readonly-type-properties': readonlyTypePropertiesRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { readonlyTypePropertiesRule };

export default plugin;
