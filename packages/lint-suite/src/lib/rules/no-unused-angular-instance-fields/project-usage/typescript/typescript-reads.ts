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
import {
  isThisExpression,
  ownMembersNamed,
  thisClassOf
} from '../utils/class-members.util.ts';

/** `this.name` declared by the enclosing class needs no checker: true when handled. */
const addOwnMemberRead = (
  node: PropertyAccessExpression,
  sink: ReadSink
): boolean => {
  const isThisAccess = isThisExpression(node.expression);

  if (!isThisAccess) return false;

  const owner = thisClassOf(node);

  if (owner === null) return false;

  const members = ownMembersNamed(owner, node.name.text);

  if (members.length === 0) return false;

  for (const member of members) sink.addDeclaration(member);

  return true;
};

const addPropertyAccessRead = (
  node: PropertyAccessExpression,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  sink.addMention(node.name.text);

  const isCandidateName = candidateNames.has(node.name.text);

  if (!isCandidateName) return;

  const isWriteTarget = isWriteOnly(node);

  if (isWriteTarget) return;

  const isOwnMember = addOwnMemberRead(node, sink);

  if (isOwnMember) return;

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

  for (const name of names ?? []) sink.addMention(name);

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
