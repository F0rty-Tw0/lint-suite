import { interval, shareReplay } from 'rxjs';

export const stream = interval(1000).pipe(shareReplay());
