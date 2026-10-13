import type { OptionalChainingComponent } from './optional-chaining.component';

export const use = (
  component: OptionalChainingComponent | undefined,
  list: string[]
): void => {
  console.log(component?.maybe);
  list.forEach(component!.handler);
};
