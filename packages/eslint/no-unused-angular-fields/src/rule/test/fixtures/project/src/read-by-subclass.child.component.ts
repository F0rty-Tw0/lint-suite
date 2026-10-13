// Scenario: the subclass reads the inherited field; its own method is read by its template.
import { Component } from '@angular/core';
import { ReadBySubclassBaseComponent } from './read-by-subclass.base.component';

@Component({
  selector: 'app-read-by-subclass-child',
  template: '{{ describe() }}'
})
export class ReadBySubclassChildComponent extends ReadBySubclassBaseComponent {
  protected describe(): string {
    return this.shared;
  }
}
