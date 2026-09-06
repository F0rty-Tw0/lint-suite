// Scenario: private members of an abstract Angular class cannot be read by subclasses and are still reported.
// expect unusedField: secret
// expect unusedMethod: hidden
import { Component } from '@angular/core';

@Component({ selector: 'app-abstract-private', template: '' })
export abstract class AbstractPrivateComponent {
  protected readonly visible = 1;
  private readonly secret = 2;

  private hidden(): void {}
}
