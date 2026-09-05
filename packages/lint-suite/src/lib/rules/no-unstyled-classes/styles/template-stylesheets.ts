import {
  componentStylesheets,
  stylesheetFiles
} from './component-stylesheets.ts';
import { stylesheetClasses } from './stylesheet-classes.ts';
import type {
  StylesheetClasses,
  StylesheetLookup,
  StylesheetSource
} from '../common/no-unstyled-classes.type.ts';

export const templateStylesheets = (
  templateFilename: string,
  cwd: string,
  globalStyles: string[]
): StylesheetLookup => {
  let known: StylesheetClasses | null = null;

  const lookup = (): StylesheetClasses => {
    if (known !== null) return known;

    const component = componentStylesheets(templateFilename);
    const global = stylesheetFiles(globalStyles, cwd);
    const sources: StylesheetSource[] = [...component, ...global];

    known = stylesheetClasses(sources);

    return known;
  };

  return lookup;
};
