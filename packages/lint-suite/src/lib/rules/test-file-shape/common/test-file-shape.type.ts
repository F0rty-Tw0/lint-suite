export type Options = [];

export type MessageIds =
  | 'forbiddenTestFile'
  | 'stubName'
  | 'stubType'
  | 'mockName'
  | 'mockFactory'
  | 'mockReturnType';

export type ForbiddenShape = {
  readonly pattern: RegExp;
  readonly shape: string;
};
