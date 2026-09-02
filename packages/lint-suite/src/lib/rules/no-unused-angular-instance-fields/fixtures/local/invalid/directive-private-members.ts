// Scenario: private directive members are still reported in local mode.
// expect unusedField: secret
// expect unusedMethod: hidden
import { Directive } from '@angular/core';

@Directive({ selector: '[appPrivate]' })
export class PrivateDirective {
  exposed = 1;
  private readonly secret = 2;

  private hidden(): void {}
}
