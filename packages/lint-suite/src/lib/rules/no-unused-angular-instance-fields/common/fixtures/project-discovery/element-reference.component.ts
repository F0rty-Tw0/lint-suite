// Scenario: a #ref without a value on an element resolves through the
// component selector matcher, not through exportAs. Only the member the
// host template names is read.
import { Component } from '@angular/core';

@Component({ selector: 'app-element-reference', template: '' })
export class ElementReferenceComponent {
  readonly label = 'used';
  readonly unreadLabel = 'unused';
}
