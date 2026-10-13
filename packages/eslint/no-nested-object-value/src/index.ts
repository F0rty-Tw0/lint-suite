import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noNestedObjectValueRule from './rule/no-nested-object-value.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-nested-object-value': noNestedObjectValueRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noNestedObjectValueRule };

export default plugin;
