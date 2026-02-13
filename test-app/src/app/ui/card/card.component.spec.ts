import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    fixture.componentRef.setInput('title', 'Test Card');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title', () => {
    const titleEl = fixture.nativeElement.querySelector('.card__title');

    expect(titleEl.textContent).toContain('Test Card');
  });

  it('should project content', () => {
    expect(fixture.nativeElement.querySelector('.card__content')).toBeTruthy();
  });
});
