// Scenario (known limitation): a read through an `any` cast is untyped, so the field is still reported.
// expect unusedField: viaAny
import { Component } from '@angular/core';

@Component({ selector: 'app-any-cast', template: '' })
export class AnyCastComponent {
  readonly viaAny = 'unused';
}
