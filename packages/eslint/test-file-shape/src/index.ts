import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import testFileShapeRule from './rule/test-file-shape.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'test-file-shape': testFileShapeRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { testFileShapeRule };

export default plugin;
