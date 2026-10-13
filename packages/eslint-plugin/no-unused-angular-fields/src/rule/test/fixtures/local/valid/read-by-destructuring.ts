// Scenario: object destructuring from `this` counts as a read of each destructured member.
import { Component } from '@angular/core';

@Component({
  selector: 'app-read-by-destructuring',
  template: '<button (click)="run()"></button>'
})
export class ReadByDestructuringComponent {
  private readonly a = 1;
  private readonly b = 2;
  private readonly c = 3;

  run(): number {
    const { a, b } = this;
    let c: number;
    ({ c } = this);
    return a + b + c;
  }
}
