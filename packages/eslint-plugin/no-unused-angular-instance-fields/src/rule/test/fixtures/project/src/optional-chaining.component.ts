// Scenario: optional chaining reads and method references passed as callbacks count as reads.
import { Component } from '@angular/core';

@Component({ selector: 'app-optional-chaining', template: '' })
export class OptionalChainingComponent {
  readonly maybe: string | null = null;

  handler(item: string): void {
    console.log(item);
  }
}
