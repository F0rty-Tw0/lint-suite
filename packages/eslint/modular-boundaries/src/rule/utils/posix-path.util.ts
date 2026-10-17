import { sep } from 'node:path';

export const toPosixPath = (path: string): string => {
  return path.split(sep).join('/');
};
