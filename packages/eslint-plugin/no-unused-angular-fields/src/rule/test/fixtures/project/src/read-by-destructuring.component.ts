// Scenario: fields read by destructuring in another file, including a rest element that reads everything left.
import { Component } from '@angular/core';

@Component({ selector: 'app-read-by-destructuring', template: '' })
export class ReadByDestructuringComponent {
  readonly named = 'used';
  readonly viaRest = 'used';

  alsoViaRest(): void {}
}
