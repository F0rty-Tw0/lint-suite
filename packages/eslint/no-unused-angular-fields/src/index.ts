import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noUnusedAngularInstanceFields from './rule/rule/no-unused-angular-instance-fields.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-unused-instance-fields': noUnusedAngularInstanceFields };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noUnusedAngularInstanceFields };

export default plugin;
