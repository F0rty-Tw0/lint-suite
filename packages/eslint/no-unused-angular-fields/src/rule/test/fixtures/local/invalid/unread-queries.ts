// Scenario: signal and decorated queries that neither the class nor its template read are reported, even when the class declares ngOnChanges.
// expect unusedField: box
// expect unusedField: requiredBox
// expect unusedField: boxes
// expect unusedField: slot
// expect unusedField: slots
// expect unusedField: legacyBox
// expect unusedField: legacyBoxes
// expect unusedField: legacySlot
// expect unusedField: legacySlots
import {
  Component,
  ContentChild,
  ContentChildren,
  ViewChild,
  ViewChildren,
  contentChild,
  contentChildren,
  viewChild,
  viewChildren
} from '@angular/core';
import type { ElementRef, OnChanges, QueryList } from '@angular/core';

@Component({ selector: 'app-unread-queries', template: '<div #box></div>' })
export class UnreadQueriesComponent implements OnChanges {
  readonly box = viewChild<ElementRef>('box');
  readonly requiredBox = viewChild.required<ElementRef>('box');
  readonly boxes = viewChildren<ElementRef>('box');
  readonly slot = contentChild<ElementRef>('slot');
  readonly slots = contentChildren<ElementRef>('slot');
  @ViewChild('box') legacyBox?: ElementRef;
  @ViewChildren('box') legacyBoxes?: QueryList<ElementRef>;
  @ContentChild('slot') legacySlot?: ElementRef;
  @ContentChildren('slot') legacySlots?: QueryList<ElementRef>;

  ngOnChanges(): void {}
}
