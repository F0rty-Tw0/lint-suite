import {
  forEachChild,
  isClassLike,
  isElementAccessExpression,
  isPropertyAccessExpression
} from 'typescript';
import type {
  ElementAccessExpression,
  Node,
  PropertyAccessExpression,
  SourceFile,
  TypeChecker
} from 'typescript';

import { collectAngularInterfaceMethods } from './typescript-angular-interface-methods.ts';
import { collectDestructuringReads } from './typescript-destructuring-reads.ts';
import {
  addNamedProperties,
  addSymbolDeclarations,
  literalPropertyNames
} from './typescript-symbol-reads.ts';
import { isWriteOnly } from './typescript-write-targets.ts';
import type { CandidateNames, ReadSink } from '../common/project-usage.type.ts';

const addPropertyAccessRead = (
  node: PropertyAccessExpression,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  const isCandidateName = candidateNames.has(node.name.text);

  if (!isCandidateName) return;

  const isWriteTarget = isWriteOnly(node);

  if (isWriteTarget) return;

  sink.addType(checker.getTypeAtLocation(node.expression));

  const symbol = checker.getSymbolAtLocation(node.name);

  if (symbol) {
    addSymbolDeclarations(checker, symbol, sink);
  }
};

const addElementAccessRead = (
  node: ElementAccessExpression,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  const isWriteTarget = isWriteOnly(node);

  if (isWriteTarget) return;

  const argumentType = checker.getTypeAtLocation(node.argumentExpression);
  const names = literalPropertyNames(argumentType);

  if (names) {
    const hasCandidateName = names.some((name) => candidateNames.has(name));

    if (!hasCandidateName) return;
  }

  const targetType = checker.getTypeAtLocation(node.expression);

  addNamedProperties(checker, targetType, names, sink);
};

export const collectTypeScriptReads = (
  sourceFile: SourceFile,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  const visit = (node: Node): void => {
    const isPropertyAccess = isPropertyAccessExpression(node);
    const isElementAccess = isElementAccessExpression(node);
    const isClass = isClassLike(node);

    if (isPropertyAccess) {
      addPropertyAccessRead(node, checker, sink, candidateNames);
    } else if (isElementAccess) {
      addElementAccessRead(node, checker, sink, candidateNames);
    } else if (isClass) {
      collectAngularInterfaceMethods(node, checker, sink);
    }

    collectDestructuringReads(node, checker, sink, candidateNames);
    forEachChild(node, visit);
  };

  visit(sourceFile);
};
