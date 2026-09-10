import { throughBarrel } from './barrel';
import { orphanUsed } from './orphan';
import { viaStar } from './star-barrel';
import type { UsedType } from './types.type';
import { usedValue } from './used';

export const consumed: UsedType = {
  id: `${usedValue}${throughBarrel}${viaStar}${orphanUsed}`
};
