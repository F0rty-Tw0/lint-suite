import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noInlineReturnObjectRule from './rule/no-inline-return-object.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-inline-return-object': noInlineReturnObjectRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noInlineReturnObjectRule };

export default plugin;
