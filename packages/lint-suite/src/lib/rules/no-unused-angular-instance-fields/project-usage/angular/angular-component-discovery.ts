import {
  canHaveDecorators,
  forEachChild,
  getDecorators,
  isCallExpression,
  isClassLike,
  isIdentifier,
  isImportDeclaration,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteralLike,
  SymbolFlags
} from 'typescript';
import type {
  Declaration,
  LeftHandSideExpression,
  Node,
  ObjectLiteralExpression,
  Program,
  TypeChecker
} from 'typescript';

import { isSpecFile } from '../utils/spec-file.js';

const importedFromAngularCore = (declaration: Declaration): boolean => {
  let current: Node = declaration;

  while (current.parent) {
    current = current.parent;

    if (isImportDeclaration(current)) {
      return (
        isStringLiteralLike(current.moduleSpecifier) &&
        current.moduleSpecifier.text === '@angular/core'
      );
    }
  }

  return false;
};

const isAngularComponentDecorator = (
  expression: LeftHandSideExpression,
  checker: TypeChecker
): boolean => {
  const unresolved = checker.getSymbolAtLocation(expression);

  if (!unresolved) {
    return false;
  }

  const symbol =
    (unresolved.flags & SymbolFlags.Alias) === 0
      ? unresolved
      : checker.getAliasedSymbol(unresolved);

  return (
    symbol.getName() === 'Component' &&
    ((unresolved.declarations ?? []).some(importedFromAngularCore) ||
      (symbol.declarations ?? []).some((declaration) =>
        declaration
          .getSourceFile()
          .fileName.replaceAll('\\', '/')
          .includes('/node_modules/@angular/core/')
      ))
  );
};

const componentMetadata = (
  declaration: Declaration,
  checker: TypeChecker
): ObjectLiteralExpression | null | undefined => {
  if (!canHaveDecorators(declaration)) {
    return undefined;
  }

  for (const decorator of getDecorators(declaration) ?? []) {
    if (
      !isCallExpression(decorator.expression) ||
      !isAngularComponentDecorator(decorator.expression.expression, checker)
    ) {
      continue;
    }

    const metadata = decorator.expression.arguments[0];

    return metadata && isObjectLiteralExpression(metadata) ? metadata : null;
  }

  return undefined;
};

export const inlineTemplate = (
  declaration: Declaration,
  checker: TypeChecker
): string | null => {
  const metadata = componentMetadata(declaration, checker);

  if (!metadata) {
    return null;
  }

  for (const property of metadata.properties) {
    if (
      isPropertyAssignment(property) &&
      (isIdentifier(property.name) ||
        isStringLiteralLike(property.name) ||
        isNumericLiteral(property.name)) &&
      property.name.text === 'template'
    ) {
      return isStringLiteralLike(property.initializer)
        ? property.initializer.text
        : null;
    }
  }

  return null;
};

export const projectComponents = (
  program: Program,
  checker: TypeChecker
): Declaration[] | null => {
  const declarations: Declaration[] = [];
  let valid = true;

  const visit = (node: Node): void => {
    if (isClassLike(node)) {
      const metadata = componentMetadata(node, checker);

      if (metadata === null) {
        valid = false;
      } else if (metadata) {
        declarations.push(node);
      }
    }

    forEachChild(node, visit);
  };

  for (const sourceFile of program.getSourceFiles()) {
    if (
      !sourceFile.isDeclarationFile &&
      !program.isSourceFileFromExternalLibrary(sourceFile) &&
      !isSpecFile(sourceFile.fileName)
    ) {
      visit(sourceFile);
    }
  }

  return valid ? declarations : null;
};
