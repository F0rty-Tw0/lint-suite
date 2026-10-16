import type { MissingTable, TableRow } from '../common/missing.type.ts';
import { OPTION_DEVIATIONS_HEADING } from '../common/parity.const.ts';

const HEADING_PATTERN = /^#{2,6}\s+(.+?)\s*$/;
const RULE_ROW_PATTERN = /^\|\s*`([^`]+)`\s*\|/;
const LINE_BREAK = /\r?\n/;
const SCOPE_HEADER = 'Scope';
const NO_COLUMN = -1;

const toCellText = (cell: string): string => {
  const trimmed = cell.trim();

  return trimmed.replaceAll('`', '');
};

const cellsOf = (line: string): string[] => {
  const parts = line.split('|');
  const cells = parts.slice(1, -1);

  return cells.map(toCellText);
};

const isHeaderRow = (line: string): boolean => {
  const isTableLine = line.startsWith('|');
  const isRuleRow = RULE_ROW_PATTERN.test(line);
  const isSeparator = line.includes('---');

  return isTableLine && !isRuleRow && !isSeparator;
};

const tableRows = (markdown: string): TableRow[] => {
  const rows: TableRow[] = [];
  let heading = '';
  let scopeColumn = NO_COLUMN;

  const lines = markdown.split(LINE_BREAK);

  for (const line of lines) {
    const headingMatch = HEADING_PATTERN.exec(line);
    const ruleMatch = RULE_ROW_PATTERN.exec(line);
    const rule = ruleMatch?.[1];
    const isHeader = isHeaderRow(line);
    const cells = cellsOf(line);

    heading = headingMatch?.[1] ?? heading;

    if (headingMatch !== null) {
      scopeColumn = NO_COLUMN;
    }

    if (isHeader) {
      scopeColumn = cells.indexOf(SCOPE_HEADER);
    }

    if (rule !== undefined) {
      const scope = cells[scopeColumn] ?? '';
      const row: TableRow = { heading, rule, scope };

      rows.push(row);
    }
  }

  return rows;
};

const isDeviationRow = (row: TableRow): boolean => {
  return row.heading === OPTION_DEVIATIONS_HEADING;
};

const isCauseRow = (row: TableRow): boolean => {
  return !isDeviationRow(row);
};

const hasScope = (row: TableRow): boolean => row.scope !== '';

const toRuleName = (row: TableRow): string => row.rule;

const toScopeEntry = (row: TableRow): [string, string] => [row.rule, row.scope];

const headingsByRule = (rows: TableRow[]): ReadonlyMap<string, string[]> => {
  const grouped = new Map<string, string[]>();

  for (const row of rows) {
    const headings = grouped.get(row.rule) ?? [];
    const isKnown = headings.includes(row.heading);

    if (!isKnown) {
      headings.push(row.heading);
    }

    grouped.set(row.rule, headings);
  }

  return grouped;
};

export const readMissing = (markdown: string): MissingTable => {
  const rows = tableRows(markdown);
  const deviationRows = rows.filter(isDeviationRow);
  const causeRows = rows.filter(isCauseRow);
  const grouped = headingsByRule(causeRows);
  const causes = new Map<string, string>();
  const duplicates = new Map<string, string[]>();

  for (const [rule, headings] of grouped) {
    const cause = headings[0] ?? '';

    causes.set(rule, cause);

    if (headings.length > 1) {
      duplicates.set(rule, headings);
    }
  }

  const deviationNames = deviationRows.map(toRuleName);
  const deviations = new Set(deviationNames);
  const scopedRows = rows.filter(hasScope);
  const scopeEntries = scopedRows.map(toScopeEntry);
  const scopes = new Map(scopeEntries);
  const table: MissingTable = { causes, deviations, scopes, duplicates };

  return table;
};
