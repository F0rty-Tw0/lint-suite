// Scenario: this spec reads specOnly, which must not count as a project read.
import type { ReadOnlyInSpecComponent } from './read-only-in-spec.component';

export const check = (component: ReadOnlyInSpecComponent): string =>
  component.specOnly;
