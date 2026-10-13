import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import rule from './rule/no-unstyled-classes.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-unstyled-classes': rule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { rule };

export default plugin;
