import {
  KeyedRead,
  PropertyRead,
  SafeKeyedRead,
  SafePropertyRead
} from '@angular/compiler';
import type { AST } from '@angular/compiler';

export const isReadTarget = (
  node: AST
): node is PropertyRead | SafePropertyRead | KeyedRead | SafeKeyedRead =>
  node instanceof PropertyRead ||
  node instanceof SafePropertyRead ||
  node instanceof KeyedRead ||
  node instanceof SafeKeyedRead;
