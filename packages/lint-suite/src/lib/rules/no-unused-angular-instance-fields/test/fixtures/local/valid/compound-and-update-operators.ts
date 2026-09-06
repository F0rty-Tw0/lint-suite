// Scenario: update and compound assignment operators read before writing.
import { Component } from '@angular/core';

@Component({
  selector: 'app-compound',
  template: '<button (click)="run()"></button>'
})
export class CompoundComponent {
  private count = 0;
  private total = 0;

  run(): void {
    this.count++;
    this.total += 1;
  }
}
