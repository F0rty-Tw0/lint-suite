import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import typePlacementRule from './rule/type-placement.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'type-placement': typePlacementRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { typePlacementRule };

export default plugin;
