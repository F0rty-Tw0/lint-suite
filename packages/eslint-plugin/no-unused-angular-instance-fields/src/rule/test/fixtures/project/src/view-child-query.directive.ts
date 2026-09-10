// Scenario: directive members read in TypeScript through a viewChild signal query in another file.
import { Directive, signal } from '@angular/core';

@Directive({ selector: '[appCounter]' })
export class CounterDirective {
  readonly count = signal(0);

  increment(): void {
    this.count.update((value) => value + 1);
  }
}
