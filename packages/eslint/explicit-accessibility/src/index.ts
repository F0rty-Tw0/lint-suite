import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import explicitAccessibilityRule from './rule/explicit-accessibility.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'explicit-accessibility': explicitAccessibilityRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { explicitAccessibilityRule };

export default plugin;
