import {
  createCssSelectorFromNode,
  parseTemplate,
  R3TargetBinder,
  ThisReceiver,
  TmplAstElement,
  TmplAstReference
} from '@angular/compiler';
import type { DirectiveMeta } from '@angular/compiler';
import type { ClassLikeDeclaration, TypeChecker } from 'typescript';

import type {
  AngularClass,
  DirectiveIndex,
  ReadSegment,
  ReadSink,
  ReferenceOwner
} from '../common/project-usage.type.js';
import { addResolvedPath } from './angular-resolved-path.js';
import { ReadCollector } from './angular-template-read-chains.js';

type TemplateReadResult = {
  /** True when a `#reference` was resolved through the directive index. */
  readonly usedDirectiveIndex: boolean;
};

/** Every identifier-like token in a text: a superset of what it can read. */
const identifierNames = (text: string): Set<string> =>
  new Set(text.match(/[A-Za-z_$][\w$]*/gu) ?? []);

const chainText = (names: ReadSegment[]): string =>
  names
    .map((segment) => `${segment.name}${segment.called ? '()' : ''}`)
    .join('.');

const templateBinder = new R3TargetBinder<DirectiveMeta>(null);

/**
 * Classes a `#reference` can resolve to. Candidates come from the whole
 * Program and are narrowed to the component's standalone `imports` when
 * that scope is known; a scope member with `hostDirectives` may expose
 * exportAs names that are not modelled, so it keeps the wider set. Extra
 * candidates only add reads.
 */
const referenceTargets = (
  reference: TmplAstReference,
  owner: ReferenceOwner | undefined,
  directives: DirectiveIndex,
  scope: ClassLikeDeclaration[] | null
): ClassLikeDeclaration[] => {
  const exportAs = reference.value.trim();
  let targets: ClassLikeDeclaration[] = [];

  if (exportAs !== '') {
    targets = [...(directives.byExportAs.get(exportAs) ?? [])];
  } else if (owner instanceof TmplAstElement) {
    directives.componentMatcher.match(
      createCssSelectorFromNode(owner),
      (_selector, declarations) => {
        targets.push(...declarations);
      }
    );
  }

  const scoped =
    scope !== null &&
    !scope.some(
      (declaration) => directives.byDeclaration.get(declaration)?.hostDirectives
    );

  return scoped ? targets.filter((target) => scope.includes(target)) : targets;
};

export const addTemplateReads = (
  { declaration, scope }: AngularClass,
  source: string,
  fileName: string,
  checker: TypeChecker,
  sink: ReadSink,
  directives: DirectiveIndex
): TemplateReadResult => {
  const parsed = parseTemplate(source, fileName);
  const className = declaration.name?.text ?? '(anonymous)';

  if (parsed.errors?.length) {
    sink.addFallbackNames(
      identifierNames(source),
      `${fileName}: template of ${className} does not parse (${parsed.errors[0]?.msg ?? 'unknown error'})`
    );

    return { usedDirectiveIndex: false };
  }

  const boundTarget = templateBinder.bind({ template: parsed.nodes });
  const reads = new ReadCollector();
  let usedDirectiveIndex = false;

  for (const node of parsed.nodes) {
    reads.visit(node);
  }

  for (const chain of reads.reads) {
    const entity =
      chain.root.receiver instanceof ThisReceiver
        ? null
        : boundTarget.getExpressionTarget(chain.root);

    if (entity === null) {
      if (!addResolvedPath(declaration, chain.names, checker, sink, true)) {
        sink.addFallbackNames(
          chain.names.map((segment) => segment.name),
          `${fileName}: cannot resolve '${chainText(chain.names)}' on ${className}`
        );
      }

      continue;
    }

    if (!(entity instanceof TmplAstReference)) continue;

    usedDirectiveIndex = true;

    const targets = referenceTargets(
      entity,
      reads.referenceOwners.get(entity),
      directives,
      scope
    );
    const names = chain.names.slice(1);
    const resolved = targets.map((target) =>
      addResolvedPath(target, names, checker, sink, false)
    );

    // ponytail: with several candidates the mismatching ones are expected
    // to fail; when none resolves, fall back to matching by name.
    if (resolved.length > 0 && !resolved.includes(true)) {
      sink.addFallbackNames(
        names.map((segment) => segment.name),
        `${fileName}: cannot resolve '#${entity.name}.${chainText(names)}' in ${className}`
      );
    }
  }

  return { usedDirectiveIndex };
};
