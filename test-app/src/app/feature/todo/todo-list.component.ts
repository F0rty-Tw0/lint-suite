import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';

import { CardComponent } from '../../ui/card/card.component';
import { TodoService } from '../../domain-logic/todo/todo.service';
import { formatDate } from '../../utils/format-date';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent],
  template: `
    <app-card title="Todo List">
      <div class="todo-stats">
        <span class="badge badge--pending">Pending: {{ todoService.pendingCount() }}</span>
        <span class="badge badge--done">Done: {{ todoService.completedCount() }}</span>
      </div>

      <div class="todo-input">
        <input
          #newTodo
          type="text"
          placeholder="Add a new todo..."
          (keyup.enter)="addTodo(newTodo.value); newTodo.value = ''"
        />
        <button
          type="button"
          class="btn btn--primary"
          (click)="addTodo(newTodo.value); newTodo.value = ''"
        >
          Add
        </button>
      </div>

      <ul class="todo-list">
        @for (todo of todoService.todos(); track todo.id) {
          <li
            class="todo-item"
            [class.todo-item--completed]="todo.completed"
          >
            <label class="todo-item__label">
              <input
                type="checkbox"
                [checked]="todo.completed"
                (change)="todoService.toggleTodo(todo.id)"
              />
              <span>{{ todo.title }}</span>
            </label>
            <time class="todo-item__date">{{ formatDate(todo.createdAt) }}</time>
          </li>
        } @empty {
          <li class="todo-empty">No todos yet. Add one above!</li>
        }
      </ul>
    </app-card>
  `,
  styles: [
    `
      .todo-stats {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      .badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.875rem;
      }

      .badge--pending {
        background: #fff3cd;
        color: #856404;
      }

      .badge--done {
        background: #d4edda;
        color: #155724;
      }

      .todo-input {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      .todo-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .btn--primary {
        background: #1ea7fd;
        color: white;
      }

      .todo-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .todo-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .todo-item--completed span {
        text-decoration: line-through;
        color: #999;
      }

      .todo-item__label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .todo-item__date {
        font-size: 0.75rem;
        color: #999;
      }

      .todo-empty {
        text-align: center;
        color: #999;
        padding: 16px;
      }
    `,
  ],
})
export class TodoListComponent implements OnInit {
  protected readonly todoService = inject(TodoService);
  protected readonly formatDate = formatDate;

  public ngOnInit(): void {
    this.todoService.loadTodos();
  }
}
