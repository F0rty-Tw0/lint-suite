// INTENTIONAL BOUNDARY VIOLATION: common should NOT import from utils
// common can only import from common
import { formatDate } from '../../utils/format-date';

export function isValidTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 200;
}

export function formatTodoDate(date: Date): string {
  return formatDate(date);
}
