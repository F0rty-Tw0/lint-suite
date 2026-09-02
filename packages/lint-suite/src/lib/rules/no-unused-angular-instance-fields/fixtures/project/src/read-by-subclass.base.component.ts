// Scenario: a protected base field is read only by a subclass in another file.
import { Component } from '@angular/core';

@Component({ selector: 'app-read-by-subclass-base', template: '' })
export class ReadBySubclassBaseComponent {
  protected readonly shared = 'shared';
}
