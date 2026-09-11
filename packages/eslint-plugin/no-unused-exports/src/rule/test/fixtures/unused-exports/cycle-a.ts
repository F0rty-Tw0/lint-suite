import { cycleB } from './cycle-b';

export type CycleShape = { readonly name: string };

export const cycleA = `a-${cycleB}`;
