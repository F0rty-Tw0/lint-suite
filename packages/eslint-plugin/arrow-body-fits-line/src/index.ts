import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import arrowBodyFitsLineRule from './rule/arrow-body-fits-line.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'arrow-body-fits-line': arrowBodyFitsLineRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { arrowBodyFitsLineRule };

export default plugin;
