import { SortState } from './table-preferences.service';

export function sortData<T>(data: T[], sort: SortState | null, fieldMapper?: (item: T, field: string) => unknown): T[] {
  if (!sort) return data;

  return [...data].sort((a, b) => {
    const aVal = resolver(a, sort.field, fieldMapper);
    const bVal = resolver(b, sort.field, fieldMapper);
    const cmp = compare(aVal, bVal);
    return sort.direction === 'desc' ? -cmp : cmp;
  });
}

function resolver<T>(item: T, field: string, mapper?: (item: T, field: string) => unknown): unknown {
  if (mapper) return mapper(item, field);
  return (item as Record<string, unknown>)[field];
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}
