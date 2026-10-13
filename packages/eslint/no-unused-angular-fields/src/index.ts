import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noUnusedAngularFieldsRule from './rule/rule/no-unused-angular-fields.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-unused-angular-fields': noUnusedAngularFieldsRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noUnusedAngularFieldsRule };

export default plugin;
