import {
  canHaveDecorators,
  forEachChild,
  getDecorators,
  isClassLike,
  isIdentifier,
  isStringLiteralLike
} from 'typescript';
import type { ClassLikeDeclaration, Node, SourceFile } from 'typescript';

const isDecoratedClass = (node: ClassLikeDeclaration): boolean => {
  const isDecoratable = canHaveDecorators(node);

  if (!isDecoratable) return false;

  const decorators = getDecorators(node);
  const decoratorCount = decorators?.length ?? 0;

  return decoratorCount > 0;
};

const addMemberNames = (node: Node, names: Set<string>): void => {
  const isClass = isClassLike(node);

  if (!isClass) return;

  const isDecorated = isDecoratedClass(node);

  if (!isDecorated) return;

  for (const member of node.members) {
    if (!member.name) continue;

    const isIdentifierName = isIdentifier(member.name);
    const isStringName = isStringLiteralLike(member.name);
    const isNamedMember = isIdentifierName || isStringName;

    if (isNamedMember) {
      names.add(member.name.text);
    }
  }
};

/** Names of members declared by decorated classes in one source file. */
export const collectCandidateNames = (sourceFile: SourceFile): Set<string> => {
  const names = new Set<string>();

  const visit = (node: Node): void => {
    addMemberNames(node, names);
    forEachChild(node, visit);
  };

  visit(sourceFile);

  return names;
};
