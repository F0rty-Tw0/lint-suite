type TypePlacementOptions = { readonly internalPatterns: string[] };

export type Options = [TypePlacementOptions];

export type MessageIds =
  | 'typeOutsideTypeFile'
  | 'valueInTypeFile'
  | 'nonConstInConstFile'
  | 'typeImportNotFromTypeFile';
