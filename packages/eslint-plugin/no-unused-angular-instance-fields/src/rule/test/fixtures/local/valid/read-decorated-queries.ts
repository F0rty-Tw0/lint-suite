// Scenario: decorated queries read by the class, its template or a query setter's own class are not reported.
import {
  Component,
  ContentChild,
  ContentChildren,
  ViewChild,
  ViewChildren
} from '@angular/core';
import type { AfterViewInit, ElementRef, QueryList } from '@angular/core';

@Component({
  selector: 'app-read-decorated-queries',
  template: '<div #box>{{ slot }}</div>'
})
export class ReadDecoratedQueriesComponent implements AfterViewInit {
  @ViewChild('box') box?: ElementRef<HTMLElement>;
  @ViewChildren('box') boxes!: QueryList<ElementRef>;
  @ContentChild('slot') slot?: ElementRef;
  @ContentChildren('slot') slots!: QueryList<ElementRef>;

  @ViewChild('other')
  set other(value: ElementRef | undefined) {
    console.log(value);
  }

  ngAfterViewInit(): void {
    this.boxes.changes.subscribe(() => console.log(this.box, this.slots));
  }
}
