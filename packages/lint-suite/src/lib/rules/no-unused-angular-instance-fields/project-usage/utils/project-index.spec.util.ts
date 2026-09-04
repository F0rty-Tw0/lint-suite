import { buildDirectiveIndex } from '../angular/angular-directive-index.ts';
import type { ProjectIndex } from '../common/project-index.type.ts';

/** A fresh, empty index; every call returns new maps so specs never share state. */
export const emptyProjectIndex = (): ProjectIndex => {
  const index: ProjectIndex = {
    candidateNames: new Set(),
    classes: new Map(),
    directives: buildDirectiveIndex([]),
    directiveShape: '',
    entries: new Map(),
    program: null,
    templateCheckDuration: 0,
    templateCheckedAt: 0,
    usage: undefined
  };

  return index;
};
