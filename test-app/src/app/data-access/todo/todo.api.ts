import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

import type { CreateTodoPayload, Todo } from '../../common/models/todo.model';

// INTENTIONAL BOUNDARY VIOLATION: data-access should NOT import from domain-logic
import { TodoService } from '../../domain-logic/todo/todo.service';

@Injectable({ providedIn: 'root' })
export class TodoApi {
  private nextId = 1;
  private readonly todos: Todo[] = [
    { id: this.nextId++, title: 'Learn Angular 21 signals', completed: false, createdAt: new Date() },
    { id: this.nextId++, title: 'Set up lint-suite', completed: true, createdAt: new Date() },
    { id: this.nextId++, title: 'Write unit tests', completed: false, createdAt: new Date() },
  ];

  public getAll$(): Observable<Todo[]> {
    return of([...this.todos]).pipe(delay(300));
  }

  public create$(payload: CreateTodoPayload): Observable<Todo> {
    const todo: Todo = {
      id: this.nextId++,
      title: payload.title,
      completed: false,
      createdAt: new Date(),
    };
    this.todos.push(todo);

    return of(todo).pipe(delay(200));
  }

  public toggle$(id: number): Observable<Todo | undefined> {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      const toggled = { ...todo, completed: !todo.completed };
      const idx = this.todos.indexOf(todo);
      this.todos[idx] = toggled;

      return of(toggled).pipe(delay(100));
    }

    return of(undefined).pipe(delay(100));
  }
}
