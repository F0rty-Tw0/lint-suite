export type Left = {
  readonly shared: string;
  readonly onlyLeft: string;
};

export type Right = {
  readonly shared: string;
  readonly onlyRight: string;
};

export type Indexed = {
  readonly [key: string]: string;
};

export const left: Left = { shared: '', onlyLeft: '' };
export const either: Left | Right = left;
export const indexed: Indexed = {};
export const maybeIndexed: Indexed | Left = left;
