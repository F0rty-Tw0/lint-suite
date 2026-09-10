type UtilPurityOptions = { readonly bannedModules: string[] };

export type Options = [UtilPurityOptions];

export type MessageIds =
  | 'impureImport'
  | 'moduleLet'
  | 'moduleState'
  | 'ambientAccess'
  | 'nondeterministic'
  | 'impureCall';
