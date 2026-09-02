// Scenario: local analysis cannot see directive consumers, so public and protected directive members are exempt.
import { Directive } from '@angular/core';

@Directive({ selector: '[appPublic]', exportAs: 'appPublic' })
export class PublicDirective {
  exposed = 1;
  protected inherited = 2;

  toggle(): void {}

  protected reset(): void {}
}
