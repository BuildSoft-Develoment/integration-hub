import { AppNavigationContribution, AppNavigationItem } from './app-navigation.models';

export function normalizeNavigationContributions(
  contributions: readonly AppNavigationContribution[],
  legacyItems: readonly AppNavigationItem[] = []
): readonly AppNavigationContribution[] {
  const normalized = [
    ...legacyItems.map((item, index) => ({
      ...item,
      source: 'legacy',
      order: index * 100,
    })),
    ...contributions,
  ];

  assertUnique(normalized, 'id');
  assertUnique(normalized, 'route');

  return [...normalized].sort((a, b) => {
    const byOrder = (a.order ?? 0) - (b.order ?? 0);
    return byOrder !== 0 ? byOrder : a.id.localeCompare(b.id);
  });
}

function assertUnique(
  items: readonly AppNavigationContribution[],
  key: 'id' | 'route'
): void {
  const seen = new Map<string, string>();
  for (const item of items) {
    const value = item[key];
    const previous = seen.get(value);
    if (previous) {
      throw new Error(
        `Duplicate navigation ${key} "${value}" from "${item.source ?? 'unknown'}"; already registered by "${previous}".`
      );
    }
    seen.set(value, item.source ?? 'unknown');
  }
}
