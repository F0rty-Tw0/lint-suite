// Scenario: a class nested inside a method does not interfere with the outer component reading its own field.
import { Component } from '@angular/core';

@Component({ selector: 'app-nested', template: '{{ make() }}' })
export class NestedComponent {
  private readonly shared = 1;

  make(): number {
    class Inner {
      read(): number {
        return 2;
      }
    }

    return this.shared + new Inner().read();
  }
}
