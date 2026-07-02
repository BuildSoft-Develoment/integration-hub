import { AppWorkspaceContribution } from '../navigation/app-navigation.models';

export function normalizeWorkspaceContributions(
  contributions: readonly AppWorkspaceContribution[]
): readonly AppWorkspaceContribution[] {
  assertUnique(contributions, (workspace) => workspace.id, 'workspace id');
  assertUnique(contributions, (workspace) => normalizeRoute(workspace.route), 'workspace route');

  return [...contributions].sort((a, b) => {
    const byOrder = (a.order ?? 0) - (b.order ?? 0);
    return byOrder !== 0 ? byOrder : a.id.localeCompare(b.id);
  });
}

function assertUnique(
  items: readonly AppWorkspaceContribution[],
  selectKey: (item: AppWorkspaceContribution) => string,
  label: string
): void {
  const seen = new Map<string, string>();
  for (const item of items) {
    const key = selectKey(item);
    const previous = seen.get(key);
    if (previous) {
      throw new Error(
        `Duplicate workspace contribution ${label} "${key}" from "${item.source ?? 'unknown'}"; already registered by "${previous}".`
      );
    }
    seen.set(key, item.source ?? 'unknown');
  }
}

function normalizeRoute(route: string): string {
  return `/${route.replace(/^\/+/, '')}`;
}
