// Scenario: classes without @Component/@Directive are ignored even with unread members.
import { Injectable, NgModule, Pipe } from '@angular/core';
import type { PipeTransform } from '@angular/core';

export class Plain {
  unread = 1;
  private hidden = 2;
  unusedMethod(): void {}
}

@Injectable({ providedIn: 'root' })
export class Service {
  private readonly cache = new Map<string, number>();
  unusedMethod(): void {}
}

@Pipe({ name: 'shout' })
export class ShoutPipe implements PipeTransform {
  private suffix = '!';
  transform(value: string): string {
    return value.toUpperCase();
  }
}

@NgModule({})
export class FeatureModule {
  unread = true;
}
