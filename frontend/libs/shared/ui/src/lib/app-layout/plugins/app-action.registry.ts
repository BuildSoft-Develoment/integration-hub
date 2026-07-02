import {
  AppActionContribution,
  AppActionKind,
} from '../navigation/app-navigation.models';

export function normalizeActionContributions(
  contributions: readonly AppActionContribution[]
): readonly AppActionContribution[] {
  const normalized = contributions.map((action) => ({
    ...action,
    kind: normalizeActionKind(action),
  }));

  normalized.forEach(validateActionContract);
  assertUnique(normalized, (action) => action.id, 'action id');

  return [...normalized].sort((a, b) => {
    const byOrder = (a.order ?? 0) - (b.order ?? 0);
    return byOrder !== 0 ? byOrder : a.id.localeCompare(b.id);
  });
}

function normalizeActionKind(action: AppActionContribution): AppActionKind {
  if (action.kind) {
    return action.kind;
  }

  if (action.route) {
    return 'navigation';
  }

  if (action.href) {
    return 'external-link';
  }

  return 'command';
}

function validateActionContract(action: AppActionContribution): void {
  assertRequired(action.id, 'action id');
  assertRequired(action.labelKey, `action ${action.id} labelKey`);

  switch (action.kind) {
    case 'navigation':
      assertRequired(action.route, `action ${action.id} route`);
      return;
    case 'external-link':
      assertRequired(action.href, `action ${action.id} href`);
      return;
    case 'command':
      assertRequired(action.command, `action ${action.id} command`);
      return;
    default:
      throw new Error(`Invalid action ${action.id} kind "${action.kind}".`);
  }
}

function assertRequired(value: string | undefined, field: string): void {
  if (!value?.trim()) {
    throw new Error(`Invalid ${field}: value is required.`);
  }
}

function assertUnique(
  items: readonly AppActionContribution[],
  selectKey: (item: AppActionContribution) => string,
  label: string
): void {
  const seen = new Map<string, string>();
  for (const item of items) {
    const key = selectKey(item);
    const previous = seen.get(key);
    if (previous) {
      throw new Error(
        `Duplicate action contribution ${label} "${key}" from "${item.source ?? 'unknown'}"; already registered by "${previous}".`
      );
    }
    seen.set(key, item.source ?? 'unknown');
  }
}
