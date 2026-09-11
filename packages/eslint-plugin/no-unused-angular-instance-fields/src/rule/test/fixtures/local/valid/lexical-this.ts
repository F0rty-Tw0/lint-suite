// Scenario: arrow functions keep the component `this`, including nested arrows in subscribe callbacks.
import { Component } from '@angular/core';
import { of } from 'rxjs';

@Component({
  selector: 'app-lexical-this',
  template: '<button (click)="run()"></button>'
})
export class LexicalThisComponent {
  private readonly viaArrow = 1;
  private readonly viaNestedArrow = 2;

  run(): void {
    const read = (): number => this.viaArrow;
    of(1).subscribe(() => {
      setTimeout(() => console.log(this.viaNestedArrow));
    });
    read();
  }
}
