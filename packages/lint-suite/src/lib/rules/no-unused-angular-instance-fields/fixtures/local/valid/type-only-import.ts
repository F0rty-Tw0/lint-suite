// Scenario: a type-only Angular import plus a local decorator named Component do not make a class Angular.
import type { Component as NgComponent } from '@angular/core';

const Component =
  (metadata: { template: string }): ClassDecorator =>
  () =>
    undefined;

@Component({ template: '' })
export class LocalDecoratorClass {
  unread = 1;

  unusedMethod(): NgComponent | null {
    return null;
  }
}
