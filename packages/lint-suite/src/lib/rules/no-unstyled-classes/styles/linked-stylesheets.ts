import { dirname } from 'node:path';

import { stylesheetFiles } from './component-stylesheets.ts';
import { linkedStylesheetHrefs } from '../../utils/template-links.util.ts';
import type { StylesheetSource } from '../common/no-unstyled-classes.type.ts';

export const linkedStylesheets = (
  template: string,
  templateFilename: string
): StylesheetSource[] => {
  const hrefs = linkedStylesheetHrefs(template);

  return stylesheetFiles(hrefs, dirname(templateFilename));
};
