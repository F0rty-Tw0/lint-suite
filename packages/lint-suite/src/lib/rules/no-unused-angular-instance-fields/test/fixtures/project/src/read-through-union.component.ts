// Scenario: a member read through a union of two component types counts for both.
import { Component } from '@angular/core';

@Component({ selector: 'app-union-left', template: '' })
export class UnionLeftComponent {
  readonly shared = 'left';
}

@Component({ selector: 'app-union-right', template: '' })
export class UnionRightComponent {
  readonly shared = 'right';
}
