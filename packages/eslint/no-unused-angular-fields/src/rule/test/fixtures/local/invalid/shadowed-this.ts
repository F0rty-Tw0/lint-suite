// Scenario: `this` inside a function expression is not the component, so the read does not count.
// expect unusedField: value
import { Component } from '@angular/core';

@Component({
  selector: 'app-shadowed-this',
  template: '<button (click)="run()"></button>'
})
export class ShadowedThisComponent {
  private readonly value = 1;

  run(): () => unknown {
    return function () {
      return this.value;
    };
  }
}
