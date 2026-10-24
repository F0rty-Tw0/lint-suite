import { readFileSync } from 'node:fs';

var legacy = 1;
let unchanged = 2;

console.log(legacy == unchanged, readFileSync);
debugger;

export const loose: any = unchanged;

export function noop() {}

import { statSync } from 'node:fs';

export { statSync };
