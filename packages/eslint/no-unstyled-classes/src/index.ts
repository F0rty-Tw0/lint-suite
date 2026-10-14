import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noUnstyledClassesRule from './rule/no-unstyled-classes.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-unstyled-classes': noUnstyledClassesRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noUnstyledClassesRule };

export default plugin;
