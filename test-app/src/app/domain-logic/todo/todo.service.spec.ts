import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { TodoService } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty todos', () => {
    expect(service.todos()).toEqual([]);
  });

  it('should have zero completed count initially', () => {
    expect(service.completedCount()).toBe(0);
  });

  it('should have zero pending count initially', () => {
    expect(service.pendingCount()).toBe(0);
  });
});
