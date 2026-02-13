export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isOverdue(date: Date): boolean {
  return date.getTime() < Date.now();
}
