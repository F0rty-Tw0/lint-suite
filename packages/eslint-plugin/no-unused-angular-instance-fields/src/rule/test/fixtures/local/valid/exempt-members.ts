// Scenario: lifecycle hooks, accessors, static, override, declare, host-decorated, #private and accessor members are never reported.
import { Component, HostBinding, HostListener } from '@angular/core';
import type { OnInit } from '@angular/core';

class Base {
  title = '';
}

@Component({ selector: 'app-exempt-members', template: '' })
export class ExemptMembersComponent extends Base implements OnInit {
  static count = 0;
  declare declared: string;
  override title = 'override';
  @HostBinding('class.on') on = true;
  #secret = 1;
  accessor stored = 1;

  get value(): number {
    return 1;
  }

  set value(next: number) {
    console.log(next);
  }

  static make(): ExemptMembersComponent {
    return new ExemptMembersComponent();
  }

  ngOnInit(): void {}

  @HostListener('click')
  onClick(): void {}
}
