// Scenario: fields read by element access with a string literal and with a union of literal keys.
import { Component } from '@angular/core';

@Component({ selector: 'app-read-by-element-access', template: '' })
export class ReadByElementAccessComponent {
  readonly bracket = 'used';
  readonly first = 1;
  readonly second = 2;
}
