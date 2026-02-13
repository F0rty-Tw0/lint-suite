import { Injectable, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type { Todo } from '../../common/models/todo.model';
import { TodoApi } from '../../data-access/todo/todo.api';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly todoApi = new TodoApi();
  private readonly _todos = signal<Todo[]>([]);

  public readonly todos = this._todos.asReadonly();
  public readonly completedCount = computed(() => this._todos().filter((t) => t.completed).length);
  public readonly pendingCount = computed(() => this._todos().filter((t) => !t.completed).length);

  public loadTodos(): void {
    this.todoApi.getAll$().subscribe((todos) => {
      this._todos.set(todos);
    });
  }

  public addTodo(title: string): void {
    this.todoApi.create$({ title }).subscribe((todo) => {
      this._todos.update((current) => [...current, todo]);
    });
  }

  public toggleTodo(id: number): void {
    this.todoApi.toggle$(id).subscribe((updated) => {
      if (updated) {
        this._todos.update((current) =>
          current.map((t) => (t.id === updated.id ? updated : t)),
        );
      }
    });
  }
}
