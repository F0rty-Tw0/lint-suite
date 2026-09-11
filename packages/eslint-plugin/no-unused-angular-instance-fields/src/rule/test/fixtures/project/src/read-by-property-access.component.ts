// Scenario: a field read by a property access on a typed instance in another file.
import { Component } from '@angular/core';

@Component({ selector: 'app-read-by-property-access', template: '' })
export class ReadByPropertyAccessComponent {
  readonly fromConsumer = 'used';
}
