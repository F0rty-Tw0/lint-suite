import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import noSpreadExpressionRule from './rule/no-spread-expression.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'no-spread-expression': noSpreadExpressionRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { noSpreadExpressionRule };

export default plugin;
