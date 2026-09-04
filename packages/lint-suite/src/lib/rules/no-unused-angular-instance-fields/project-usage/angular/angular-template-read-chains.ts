import {
  Binary,
  Call,
  CombinedRecursiveAstVisitor,
  ImplicitReceiver,
  KeyedRead,
  PropertyRead,
  SafeKeyedRead,
  SafePropertyRead,
  ThisReceiver,
  TmplAstComponent,
  TmplAstDirective,
  TmplAstElement,
  TmplAstReference,
  TmplAstTemplate
} from '@angular/compiler';

import type {
  ReadChain,
  ReadSegment,
  ReferenceOwner
} from '../common/project-usage.type.js';

const readChain = (node: PropertyRead | SafePropertyRead): ReadChain | null => {
  const names: ReadSegment[] = [];
  let current: PropertyRead | SafePropertyRead = node;
  let called = false;

  while (true) {
    names.unshift({ called, name: current.name });

    if (
      current.receiver instanceof PropertyRead ||
      current.receiver instanceof SafePropertyRead
    ) {
      current = current.receiver;
      called = false;
      continue;
    }

    if (current.receiver instanceof Call) {
      if (
        !(current.receiver.receiver instanceof PropertyRead) &&
        !(current.receiver.receiver instanceof SafePropertyRead)
      ) {
        return null;
      }

      current = current.receiver.receiver;
      called = true;
      continue;
    }

    return (current.receiver instanceof ImplicitReceiver ||
      current.receiver instanceof ThisReceiver) &&
      current instanceof PropertyRead
      ? { names, root: current }
      : null;
  }
};

export class ReadCollector extends CombinedRecursiveAstVisitor {
  readonly reads: ReadChain[] = [];
  readonly referenceOwners = new Map<TmplAstReference, ReferenceOwner>();

  private record(node: PropertyRead | SafePropertyRead): void {
    const chain = readChain(node);

    if (chain) {
      this.reads.push(chain);
    }
  }

  private recordReferences(owner: ReferenceOwner): void {
    for (const reference of owner.references) {
      this.referenceOwners.set(reference, owner);
    }
  }

  override visitElement(element: TmplAstElement): void {
    this.recordReferences(element);
    super.visitElement(element);
  }

  override visitTemplate(template: TmplAstTemplate): void {
    this.recordReferences(template);
    super.visitTemplate(template);
  }

  override visitComponent(component: TmplAstComponent): void {
    this.recordReferences(component);
    super.visitComponent(component);
  }

  override visitDirective(directive: TmplAstDirective): void {
    this.recordReferences(directive);
    super.visitDirective(directive);
  }

  override visitBinary(node: Binary, context: unknown): unknown {
    if (node.operation !== '=') return super.visitBinary(node, context);

    if (
      node.left instanceof PropertyRead ||
      node.left instanceof SafePropertyRead ||
      node.left instanceof KeyedRead ||
      node.left instanceof SafeKeyedRead
    ) {
      this.visit(node.left.receiver);
    }

    if (node.left instanceof KeyedRead || node.left instanceof SafeKeyedRead) {
      this.visit(node.left.key);
    }

    this.visit(node.right);

    return undefined;
  }

  override visitPropertyRead(node: PropertyRead, context: unknown): unknown {
    this.record(node);

    return super.visitPropertyRead(node, context);
  }

  override visitSafePropertyRead(
    node: SafePropertyRead,
    context: unknown
  ): unknown {
    this.record(node);

    return super.visitSafePropertyRead(node, context);
  }
}
