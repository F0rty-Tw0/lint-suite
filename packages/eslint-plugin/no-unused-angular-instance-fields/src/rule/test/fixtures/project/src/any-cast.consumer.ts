import type { AnyCastComponent } from './any-cast.component';

export const peek = (component: AnyCastComponent): unknown =>
  (component as any).viaAny;
