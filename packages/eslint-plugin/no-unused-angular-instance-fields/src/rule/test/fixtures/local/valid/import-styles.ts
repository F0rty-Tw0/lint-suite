// Scenario: namespace and aliased imports still detect Angular classes; all members here are read.
import * as ng from '@angular/core';
import { Directive as Dir } from '@angular/core';

@ng.Component({ selector: 'app-namespace', template: '{{ heading }}' })
export class NamespaceComponent {
  protected readonly heading = 'ns';
}

@Dir({ selector: '[appAliased]' })
export class AliasedDirective {
  private readonly counter = 0;

  read(): number {
    return this.counter;
  }
}
