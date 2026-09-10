import {
  SyntaxKind,
  isClassLike,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessor,
  isIdentifier,
  isMethodDeclaration,
  isObjectLiteralExpression,
  isPrivateIdentifier,
  isSetAccessor,
  isSourceFile,
  isStringLiteralLike
} from 'typescript';
import type { ClassElement, ClassLikeDeclaration, Node } from 'typescript';

const memberNameOf = (member: ClassElement): string | null => {
  const { name } = member;

  if (!name) return null;

  const isIdentifierName = isIdentifier(name);
  const isPrivateName = isPrivateIdentifier(name);
  const isStringName = isStringLiteralLike(name);
  const isTextName = isIdentifierName || isPrivateName || isStringName;

  if (!isTextName) return null;

  return name.text;
};

/** Members the class declares itself under `name`, without the type checker. */
export const ownMembersNamed = (
  declaration: ClassLikeDeclaration,
  name: string
): ClassElement[] => {
  const isNamed = (member: ClassElement): boolean => {
    return memberNameOf(member) === name;
  };

  return declaration.members.filter(isNamed);
};

const isObjectLiteralMember = (node: Node): boolean => {
  const isMethod = isMethodDeclaration(node);
  const isGetter = isGetAccessor(node);
  const isSetter = isSetAccessor(node);
  const isMember = isMethod || isGetter || isSetter;

  if (!isMember) return false;

  return isObjectLiteralExpression(node.parent);
};

const isThisBoundary = (node: Node): boolean => {
  const isDeclaration = isFunctionDeclaration(node);
  const isExpression = isFunctionExpression(node);
  const isFunction = isDeclaration || isExpression;

  if (isFunction) return true;

  return isObjectLiteralMember(node);
};

/**
 * The class `this` refers to at `node`, or null when a `function` or an
 * object literal rebinds it first (then only the checker knows).
 */
export const thisClassOf = (node: Node): ClassLikeDeclaration | null => {
  let current = node.parent;

  while (!isSourceFile(current)) {
    if (isClassLike(current)) return current;

    const isBoundary = isThisBoundary(current);

    if (isBoundary) return null;

    current = current.parent;
  }

  return null;
};

export const isThisExpression = (node: Node): boolean => {
  return node.kind === SyntaxKind.ThisKeyword;
};
