import assert from 'node:assert/strict';
import { join } from 'node:path';

import {
  createProgram,
  forEachChild,
  isClassDeclaration,
  isClassElement,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isSourceFile
} from 'typescript';
import type {
  ClassDeclaration,
  ClassElement,
  Node,
  PropertyAccessExpression
} from 'typescript';
import { test } from 'vitest';

import {
  isThisExpression,
  ownMembersNamed,
  thisClassOf
} from './class-members.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';

const sampleFilename = join(fixtureDirectory('class-members'), 'sample.ts');
const program = createProgram([sampleFilename], { noLib: true });
const sourceFile = program.getSourceFile(sampleFilename);

program.getTypeChecker();

assert.ok(sourceFile, 'class-members fixture must be part of the program');

const classes = new Map<string, ClassDeclaration>();
const thisAccesses: PropertyAccessExpression[] = [];

const collectClass = (node: Node): void => {
  if (!isClassDeclaration(node)) return;

  if (node.name) classes.set(node.name.text, node);
};

const collectThisAccess = (node: Node): void => {
  if (!isPropertyAccessExpression(node)) return;

  const isThisAccess = isThisExpression(node.expression);

  if (isThisAccess) thisAccesses.push(node);
};

const visit = (node: Node): void => {
  collectClass(node);
  collectThisAccess(node);
  forEachChild(node, visit);
};

visit(sourceFile);

const widget = classes.get('Widget');

assert.ok(widget, 'fixture must declare Widget');

const identifierName = (member: ClassElement): string | null => {
  if (!member.name) return null;

  if (!isIdentifier(member.name)) return null;

  return member.name.text;
};

const classMemberName = (node: Node): string | null => {
  if (!isClassElement(node)) return null;

  const isLiteralMember = isObjectLiteralExpression(node.parent);

  if (isLiteralMember) return null;

  return identifierName(node);
};

const enclosingMemberName = (node: Node): string | null => {
  let current = node.parent;

  while (!isSourceFile(current)) {
    const name = classMemberName(current);

    if (name !== null) return name;

    current = current.parent;
  }

  return null;
};

const matchesMember = (node: Node, member: string): boolean => {
  return enclosingMemberName(node) === member;
};

const accessIn = (member: string): PropertyAccessExpression => {
  const access = thisAccesses.find((node) => matchesMember(node, member));

  assert.ok(access, `fixture must read this inside ${member}`);

  return access;
};

test('finds fields, accessors, quoted and private members by name', () => {
  assert.equal(ownMembersNamed(widget, 'title').length, 1);
  assert.equal(ownMembersNamed(widget, 'title2').length, 2);
  assert.equal(ownMembersNamed(widget, 'quoted').length, 1);
  assert.equal(ownMembersNamed(widget, '#secret').length, 1);
  assert.deepEqual(ownMembersNamed(widget, 'inherited'), []);
  assert.deepEqual(ownMembersNamed(widget, 'missing'), []);
});

test('resolves this to the class through methods and arrows', () => {
  assert.equal(thisClassOf(accessIn('direct')), widget);
  assert.equal(thisClassOf(accessIn('arrow')), widget);
});

test('gives up on this inside a function or an object literal method', () => {
  assert.equal(thisClassOf(accessIn('nestedFunction')), null);
  assert.equal(thisClassOf(accessIn('objectLiteral')), null);
});
