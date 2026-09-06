// Scenario: fields read via this.x, methods called from other methods, methods passed as callbacks.
import { Component } from '@angular/core';

@Component({
  selector: 'app-read-by-typescript',
  template: '<button (click)="run()"></button>'
})
export class ReadByTypescriptComponent {
  private readonly items = ['a', 'b'];
  private total = 0;

  run(): number {
    this.items.forEach(this.handle);
    return this.sum() + this.total;
  }

  private sum(): number {
    return this.items.length;
  }

  private handle(item: string): void {
    this.total += item.length;
  }
}
