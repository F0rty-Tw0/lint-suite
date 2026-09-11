// Scenario: reads wrapped in non-null, as, and satisfies expressions still count.
import { Component } from '@angular/core';

@Component({
  selector: 'app-wrappers',
  template: '<button (click)="run()"></button>'
})
export class WrappersComponent {
  private readonly viaNonNullThis = 1;
  private readonly viaCast = 2;
  private readonly viaNonNullProperty: number | null = 3;
  private readonly viaSatisfies = 4;

  run(): number {
    return (
      this!.viaNonNullThis +
      (this as WrappersComponent).viaCast +
      this.viaNonNullProperty! +
      (this.viaSatisfies satisfies number)
    );
  }
}
