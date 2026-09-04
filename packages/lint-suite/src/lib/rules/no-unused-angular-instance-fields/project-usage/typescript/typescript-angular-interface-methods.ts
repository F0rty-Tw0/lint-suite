import { SyntaxKind, isMethodSignature } from 'typescript';
import type {
  ClassLikeDeclaration,
  Declaration,
  Symbol,
  Type,
  TypeChecker
} from 'typescript';

import type { ReadSink } from '../common/project-usage.type.ts';
import { addSymbolDeclarations } from './typescript-symbol-reads.ts';

const isAngularMethodSignature = (declaration: Declaration): boolean => {
  const isMethod = isMethodSignature(declaration);

  if (!isMethod) return false;

  const fileName = declaration.getSourceFile().fileName.replaceAll('\', '/');

  return fileName.includes('/node_modules/@angular/');
};

const isAngularInterfaceMethod = (symbol: Symbol): boolean => {
  const declarations = symbol.declarations ?? [];

  return declarations.some(isAngularMethodSignature);
};

const addImplementations = (
  heritageType: Type,
  classType: Type,
  checker: TypeChecker,
  sink: ReadSink
): void => {
  for (const interfaceMethod of heritageType.getProperties()) {
    const isInterfaceMethod = isAngularInterfaceMethod(interfaceMethod);

    if (!isInterfaceMethod) continue;

    const implementation = classType.getProperty(interfaceMethod.name);

    if (implementation) {
      addSymbolDeclarations(checker, implementation, sink);
    }
  }
};

/**
 * Angular calls lifecycle and forms methods through the interfaces a class
 * implements, so an implementation of one counts as read.
 */
export const collectAngularInterfaceMethods = (
  node: ClassLikeDeclaration,
  checker: TypeChecker,
  sink: ReadSink
): void => {
  const heritageClauses = node.heritageClauses ?? [];
  const implementsClauses = heritageClauses.filter(
    (clause) => clause.token === SyntaxKind.ImplementsKeyword
  );

  if (implementsClauses.length === 0) return;

  const classType = checker.getTypeAtLocation(node);

  for (const clause of implementsClauses) {
    for (const heritageType of clause.types) {
      const type = checker.getTypeAtLocation(heritageType);

      sink.addType(type);
      addImplementations(type, classType, checker, sink);
    }
  }
};
