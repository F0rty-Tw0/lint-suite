import { TmplAstElement, createCssSelectorFromNode } from '@angular/compiler';
import type { TmplAstReference } from '@angular/compiler';

import type { ClassLikeDeclaration } from 'typescript';

import { addResolvedPath } from './angular-resolved-path.ts';
import type {
  DirectiveIndex,
  ReadSegment,
  ReferenceOwner,
  ResolvedPathOptions,
  TemplateReadContext
} from '../common/project-usage.type.ts';
import { chainText } from '../utils/read-chain-text.util.ts';

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
    const exportedTargets = directives.byExportAs.get(exportAs) ?? [];

    targets = [...exportedTargets];
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

  if (!scoped) return targets;

  const scopedTargets = targets.filter((target) => scope.includes(target));

  return scopedTargets;
};

/** Reads made on the classes a template `#reference` resolves to. */
export const addReferenceRead = (
  context: TemplateReadContext,
  reference: TmplAstReference,
  owner: ReferenceOwner | undefined,
  names: ReadSegment[]
): void => {
  const { checker, className, directives, fileName, scope, sink } = context;
  const targets = referenceTargets(reference, owner, directives, scope);
  const isTargetResolved = (target: ClassLikeDeclaration): boolean => {
    const options: ResolvedPathOptions = {
      allowMissingRoot: false,
      checker,
      declaration: target,
      names,
      sink
    };

    return addResolvedPath(options);
  };
  const resolved = targets.map(isTargetResolved);
  const hasResolvedTarget = resolved.includes(true);

  if (resolved.length === 0) return;

  if (hasResolvedTarget) return;

  const fallbackNames = names.map((segment) => segment.name);
  const reason = `${fileName}: cannot resolve '#${reference.name}.${chainText(names)}' in ${className}`;

  sink.addFallbackNames(fallbackNames, reason);
};
