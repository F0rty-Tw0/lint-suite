// Scenario: abstract Angular base classes exist to be subclassed, so their non-private members are exempt locally.
import { Component, Directive } from '@angular/core';

@Component({ selector: 'app-abstract-base', template: '' })
export abstract class AbstractBaseComponent {
  protected readonly shared = 'shared';
  readonly exposed = 'exposed';

  protected describe(): string {
    return 'base';
  }

  abstract render(): void;
}

@Directive()
export abstract class AbstractBaseDirective {
  protected readonly config = {};

  attach(): void {}
}
