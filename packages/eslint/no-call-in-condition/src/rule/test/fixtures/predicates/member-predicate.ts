type Foo = { kind: 'foo' };

const guards = {
  looksLikeFoo: (value: unknown): value is Foo => {
    return typeof value === 'object';
  }
};

export const describeFoo = (value: unknown): string => {
  if (guards.looksLikeFoo(value)) return value.kind;

  return 'other';
};
