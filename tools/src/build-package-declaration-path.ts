import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import ts from 'typescript';

import type { BuildPackageContext } from './common/build-package.type.ts';

type DeclarationEdit = {
  readonly end: number;
  readonly replacement: string;
  readonly start: number;
};

const privateImportPrefix = '@lint-suite/rule-internals/';

export const declarationPath = (
  context: BuildPackageContext,
  sourcePath: string
): string => {
  const ownPath = relative(context.sourceRoot, sourcePath);
  const isOwnSource = !ownPath.startsWith('..') && !isAbsolute(ownPath);

  if (isOwnSource) {
    return resolve(context.outputRoot, ownPath.replace(/\.ts$/, '.d.ts'));
  }

  const privatePath = relative(context.privateRoot, sourcePath);
  const isPrivateSource =
    !privatePath.startsWith('..') && !isAbsolute(privatePath);

  if (isPrivateSource) {
    return resolve(
      context.outputRoot,
      'internal',
      privatePath.replace(/\.ts$/, '.d.ts')
    );
  }

  throw new Error(`Declaration escapes owning package: ${sourcePath}`);
};

const declarationImportSpecifier = (
  context: BuildPackageContext,
  destination: string,
  importPath: string
): string => {
  const sourcePath = resolve(
    context.privateRoot,
    importPath.slice(privateImportPrefix.length)
  );
  const targetPath = declarationPath(context, sourcePath);
  let specifier = relative(dirname(destination), targetPath)
    .split(sep)
    .join('/')
    .replace(/\.d\.ts$/, '.js');

  if (!specifier.startsWith('.')) {
    specifier = `./${specifier}`;
  }

  return specifier;
};

export const rewrittenDeclaration = (
  context: BuildPackageContext,
  destination: string,
  fileName: string,
  text: string
): string => {
  const declaration = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true
  );
  const edits: DeclarationEdit[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) && node.text.startsWith(privateImportPrefix)) {
      const specifier = declarationImportSpecifier(
        context,
        destination,
        node.text
      );
      const edit: DeclarationEdit = {
        end: node.end,
        replacement: JSON.stringify(specifier),
        start: node.getStart(declaration)
      };
      edits.push(edit);
    }

    ts.forEachChild(node, visit);
  };

  visit(declaration);

  let rewritten = text;
  const reverseEdits = [...edits].reverse();

  for (const edit of reverseEdits) {
    rewritten =
      rewritten.slice(0, edit.start) +
      edit.replacement +
      rewritten.slice(edit.end);
  }

  return rewritten;
};
