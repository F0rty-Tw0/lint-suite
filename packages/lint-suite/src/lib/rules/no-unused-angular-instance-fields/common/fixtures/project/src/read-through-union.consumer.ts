import type {
  UnionLeftComponent,
  UnionRightComponent
} from './read-through-union.component';

export const label = (
  either: UnionLeftComponent | UnionRightComponent
): string => either.shared;
