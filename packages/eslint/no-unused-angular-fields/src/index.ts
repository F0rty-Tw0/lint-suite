import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noUnusedInstanceFieldsRule from './rule/rule/no-unused-instance-fields.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-unused-instance-fields': noUnusedInstanceFieldsRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noUnusedInstanceFieldsRule };

export default plugin;
