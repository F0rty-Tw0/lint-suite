// Scenario: assignments, delete, for-of targets and destructuring targets are writes, not reads.
// expect unusedField: x
// expect unusedField: y
// expect unusedField: z
// expect unusedField: w
// expect unusedField: v
import { Component } from '@angular/core';

@Component({
  selector: 'app-write-only',
  template: '<button (click)="run()"></button>'
})
export class WriteOnlyComponent {
  private x = 0;
  private y?: number;
  private z = 0;
  private w = 0;
  private v = 0;

  run(list: number[], arr: number[], obj: { v: number }): void {
    this.x = 1;
    delete this.y;
    for (this.z of list) {
      console.log(list);
    }
    [this.w] = arr;
    ({ v: this.v } = obj);
  }
}
