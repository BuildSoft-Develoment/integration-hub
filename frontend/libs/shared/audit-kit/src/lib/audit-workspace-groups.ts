import { AppWorkspaceContribution } from '@integration-hub/shared/ui';

/** Un dominio del hub de auditoria (ADR-019): generico de plataforma o un estandar (SWIFT MT101, ...). */
export interface AuditDomainGroup {
  readonly domain: string;
  readonly labelKey: string | null;
  readonly order: number;
  readonly items: readonly AppWorkspaceContribution[];
}

/**
 * Agrupa las contribuciones de workspace de auditoria por dominio, ordenadas por `domainOrder` (y dentro
 * de cada dominio por orden de registro). Fuente de verdad unica compartida por el hub (tarjetas de pack)
 * y el sub-nav scoped de cada pack.
 */
export function groupAuditWorkspacesByDomain(
  items: readonly AppWorkspaceContribution[]
): AuditDomainGroup[] {
  const byDomain = new Map<string, { domain: string; labelKey: string | null; order: number; items: AppWorkspaceContribution[] }>();
  for (const item of items) {
    const domain = item.domain ?? 'other';
    let group = byDomain.get(domain);
    if (!group) {
      group = { domain, labelKey: item.domainLabelKey ?? null, order: item.domainOrder ?? 999, items: [] };
      byDomain.set(domain, group);
    }
    group.items.push(item);
  }
  return [...byDomain.values()].sort((a, b) => a.order - b.order);
}
