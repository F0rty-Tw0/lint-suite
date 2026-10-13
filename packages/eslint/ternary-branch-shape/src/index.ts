import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import ternaryBranchShapeRule from './rule/ternary-branch-shape.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'ternary-branch-shape': ternaryBranchShapeRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { ternaryBranchShapeRule };

export default plugin;
