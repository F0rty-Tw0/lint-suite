// Scenario: the consumer calls into the queried directive.
import { Component, viewChild } from '@angular/core';
import { CounterDirective } from './view-child-query.directive';

@Component({
  selector: 'app-view-child-query-consumer',
  imports: [CounterDirective],
  template: '<div appCounter (click)="bump()"></div>'
})
export class ViewChildQueryConsumerComponent {
  private readonly counter = viewChild.required(CounterDirective);

  protected bump(): number {
    this.counter().increment();
    return this.counter().count();
  }
}
