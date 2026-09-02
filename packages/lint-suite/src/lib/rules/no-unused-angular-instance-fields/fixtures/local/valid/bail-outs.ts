// Scenario: dynamic member access, template parse errors, computed host keys, metadata spreads and missing templates disable reporting for that class.
import { Component } from '@angular/core';

const hostKey = '[class.on]';
const base = { selector: 'app-spread', template: '' };

@Component({ selector: 'app-dynamic', template: '' })
export class DynamicAccessComponent {
  private readonly unread = 1;

  read(key: string): unknown {
    return this[key as keyof this];
  }
}

@Component({ selector: 'app-broken-template', template: '<div' })
export class BrokenTemplateComponent {
  private readonly unread = 1;
}

@Component({
  selector: 'app-computed-host',
  template: '',
  host: { [hostKey]: 'on' }
})
export class ComputedHostComponent {
  private readonly on = true;
}

@Component({ ...base })
export class SpreadMetadataComponent {
  private readonly unread = 1;
}

@Component({
  selector: 'app-missing-template',
  templateUrl: './does-not-exist.html'
})
export class MissingTemplateComponent {
  private readonly unread = 1;
}
