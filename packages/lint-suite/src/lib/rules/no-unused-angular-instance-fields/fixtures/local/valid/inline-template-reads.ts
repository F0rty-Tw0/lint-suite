// Scenario: every inline template syntax that reads a component member.
import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inline-template',
  imports: [FormsModule, NgIf, NgFor],
  template: `
    <h1>{{ heading }}</h1>
    <p [title]="tooltip">{{ user?.name }}</p>
    <button (click)="save()">Save</button>
    <input [(ngModel)]="value" #box />
    <span>{{ box.value }}</span>
    <ul>
      {{
        items | slice: start : end
      }}
    </ul>
    @if (flag; as f) {
      <b>{{ f }}</b>
    }
    @for (item of items; track item.id) {
      <li>{{ item.id }}</li>
    }
    @switch (mode) {
      @case ('a') {
        <i>a</i>
      }
    }
    @let total = count;
    <em>{{ total }}</em>
    @defer (when ready) {
      <p>{{ this.explicit }}</p>
    }
    <div *ngIf="visible">{{ label }}</div>
    <p *ngFor="let row of rows; trackBy: track">{{ row }}</p>
    <ng-template let-row>{{ row }}</ng-template>
  `
})
export class InlineTemplateComponent {
  protected readonly heading = 'Heading';
  protected readonly tooltip = 'Tooltip';
  protected readonly user: { name: string } | null = null;
  protected value = '';
  protected readonly items: Array<{ id: number }> = [];
  protected readonly start = 0;
  protected readonly end = 1;
  protected readonly flag = true;
  protected readonly mode = 'a';
  protected readonly count = 1;
  protected readonly ready = false;
  protected readonly explicit = 'explicit';
  protected readonly visible = true;
  protected readonly label = 'label';
  protected readonly rows = ['r'];

  protected save(): void {}

  protected track(index: number): number {
    return index;
  }
}
