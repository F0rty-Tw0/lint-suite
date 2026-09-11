import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noInlineObjectTypesRule from './rule/no-inline-object-types.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-inline-object-types': noInlineObjectTypesRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noInlineObjectTypesRule };

export default plugin;
