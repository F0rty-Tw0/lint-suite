// Scenario: several Angular classes in one file, including a decorated class expression, each tracked separately.
import { Component, Directive } from '@angular/core';

@Component({ selector: 'app-first', template: '{{ first }}' })
export class FirstComponent {
  protected readonly first = 1;
}

@Directive({ selector: '[appSecond]' })
export class SecondDirective {
  private readonly second = 2;

  read(): number {
    return this.second;
  }
}

export const ThirdComponent =
  @Component({ selector: 'app-third', template: '{{ third }}' })
  class {
    protected readonly third = 3;
  };
