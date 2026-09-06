// Scenario: a read inside a nested class belongs to that class, not to the outer component.
// expect unusedField: shared
import { Component } from '@angular/core';

@Component({ selector: 'app-nested-read', template: '{{ make() }}' })
export class NestedReadComponent {
  private readonly shared = 1;

  make(): unknown {
    class Inner {
      readonly shared = 2;

      read(): number {
        return this.shared;
      }
    }

    return new Inner();
  }
}
