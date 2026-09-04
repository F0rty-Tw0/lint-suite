import type {
  AST,
  Binary,
  TmplAstComponent,
  TmplAstDirective,
  TmplAstElement,
  TmplAstReference,
  TmplAstTemplate
} from '@angular/compiler';
import {
  Call,
  CombinedRecursiveAstVisitor,
  ImplicitReceiver,
  KeyedRead,
  PropertyRead,
  SafeKeyedRead,
  SafePropertyRead,
  ThisReceiver
} from '@angular/compiler';

import { isReadTarget } from '../../utils/angular-read-target.util.ts';
import type {
  ReadChain,
  ReadSegment,
  ReferenceOwner
} from '../common/project-usage.type.ts';

type ChainStep = {
  readonly called: boolean;
  readonly next: PropertyRead | SafePropertyRead;
};

const isPropertyReadLike = (
  node: AST
): node is PropertyRead | SafePropertyRead => {
  const isPlainRead = node instanceof PropertyRead;
  const isSafeRead = node instanceof SafePropertyRead;

  return isPlainRead || isSafeRead;
};

const isRootRead = (read: PropertyRead | SafePropertyRead): boolean => {
  const isImplicitReceiver = read.receiver instanceof ImplicitReceiver;
  const isThisReceiver = read.receiver instanceof ThisReceiver;

  return isImplicitReceiver || isThisReceiver;
};

const chainStep = (read: PropertyRead | SafePropertyRead): ChainStep | null => {
  const receiver = read.receiver;
  const isReadReceiver = isPropertyReadLike(receiver);

  if (isReadReceiver) {
    const readStep: ChainStep = { called: false, next: receiver };

    return readStep;
  }

  const isCallReceiver = receiver instanceof Call;

  if (!isCallReceiver) return null;

  const target = receiver.receiver;
  const isReadLikeTarget = isPropertyReadLike(target);

  if (!isReadLikeTarget) return null;

  const calledStep: ChainStep = { called: true, next: target };

  return calledStep;
};

const readChain = (node: PropertyRead | SafePropertyRead): ReadChain | null => {
  const leaf: ReadSegment = { called: false, name: node.name };
  const names: ReadSegment[] = [leaf];
  let current = node;

  while (!isRootRead(current)) {
    const step = chainStep(current);

    if (step === null) return null;

    current = step.next;
    names.unshift({ called: step.called, name: current.name });
  }

  if (!(current instanceof PropertyRead)) return null;

  const chain: ReadChain = { names, root: current };

  return chain;
};

export class ReadCollector extends CombinedRecursiveAstVisitor {
  public readonly reads: ReadChain[] = [];
  public readonly referenceOwners = new Map<TmplAstReference, ReferenceOwner>();

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

  public override visitElement(element: TmplAstElement): void {
    this.recordReferences(element);
    super.visitElement(element);
  }

  public override visitTemplate(template: TmplAstTemplate): void {
    this.recordReferences(template);
    super.visitTemplate(template);
  }

  public override visitComponent(component: TmplAstComponent): void {
    this.recordReferences(component);
    super.visitComponent(component);
  }

  public override visitDirective(directive: TmplAstDirective): void {
    this.recordReferences(directive);
    super.visitDirective(directive);
  }

  public override visitBinary(node: Binary, context: unknown): unknown {
    if (node.operation !== '=') return super.visitBinary(node, context);

    if (isReadTarget(node.left)) {
      this.visit(node.left.receiver);
    }

    if (node.left instanceof KeyedRead || node.left instanceof SafeKeyedRead) {
      this.visit(node.left.key);
    }

    this.visit(node.right);

    return undefined;
  }

  public override visitPropertyRead(
    node: PropertyRead,
    context: unknown
  ): unknown {
    this.record(node);

    return super.visitPropertyRead(node, context);
  }

  public override visitSafePropertyRead(
    node: SafePropertyRead,
    context: unknown
  ): unknown {
    this.record(node);

    return super.visitSafePropertyRead(node, context);
  }
}
