import type { ReadByDestructuringComponent } from './read-by-destructuring.component';

export const split = (component: ReadByDestructuringComponent): unknown => {
  const { named, ...rest } = component;

  return [named, rest];
};
