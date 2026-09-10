import type { ESLint } from 'eslint';

import manifest from '../package.json' with { type: 'json' };
import chainReceiverIsNameRule from './rule/chain-receiver-is-name.ts';

const meta = { name: manifest.name, version: manifest.version };
const rules = { 'chain-receiver-is-name': chainReceiverIsNameRule };
const plugin: ESLint.Plugin = { meta };

Object.assign(plugin, { rules });

export { chainReceiverIsNameRule };

export default plugin;
