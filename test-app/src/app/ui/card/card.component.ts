import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// INTENTIONAL BOUNDARY VIOLATION: ui should NOT import from feature
import { TodoListComponent } from '../../feature/todo/todo-list.component';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <h2 class="card__title">{{ title() }}</h2>
      <div class="card__content">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        background: white;
        box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
      }

      .card__title {
        margin: 0 0 12px;
        font-size: 1.25rem;
        font-weight: 600;
      }
    `,
  ],
})
export class CardComponent {
  public readonly title = input.required<string>();
}
