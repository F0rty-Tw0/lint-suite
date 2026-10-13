import type { ReadByElementAccessComponent } from './read-by-element-access.component';

export const pick = (
  component: ReadByElementAccessComponent,
  key: 'first' | 'second'
): string => component['bracket'] + component[key];
