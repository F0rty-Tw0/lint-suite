import {
  KeyedRead,
  PropertyRead,
  SafeKeyedRead,
  SafePropertyRead
} from '@angular/compiler';
import type { AST } from '@angular/compiler';

export const isReadTarget = (
  node: AST
): node is PropertyRead | SafePropertyRead | KeyedRead | SafeKeyedRead => {
  const isPropertyRead = node instanceof PropertyRead;
  const isSafePropertyRead = node instanceof SafePropertyRead;
  const isKeyedRead = node instanceof KeyedRead;
  const isSafeKeyedRead = node instanceof SafeKeyedRead;

  return isPropertyRead || isSafePropertyRead || isKeyedRead || isSafeKeyedRead;
};
