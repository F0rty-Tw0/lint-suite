import { buildDirectiveIndex } from '../../angular/angular-directive-index.ts';
import type {
  DirectiveState,
  ProjectIndex,
  TemplateCheck
} from '../../common/project-index.type.ts';

/** A fresh, empty index; every call returns new maps so specs never share state. */
export const emptyProjectIndex = (): ProjectIndex => {
  const directives = buildDirectiveIndex([]);
  const directiveState: DirectiveState = { directives, shape: '' };
  const templateCheck: TemplateCheck = { checkedAt: 0, duration: 0 };
  const index: ProjectIndex = {
    candidateNames: new Set(),
    classes: new Map(),
    declarationCounts: new Map(),
    directiveState,
    entries: new Map(),
    fallbackNameCounts: new Map(),
    program: null,
    templateCheck
  };

  return index;
};
