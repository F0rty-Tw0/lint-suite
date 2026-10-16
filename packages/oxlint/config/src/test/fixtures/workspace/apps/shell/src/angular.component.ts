import { Component, EventEmitter, Output } from '@angular/core';

@Component({ selector: 'app-fixture', template: '' })
export class FixtureComponent {
  private unused = 1;
  @Output() changed = new EventEmitter<string>();
}
