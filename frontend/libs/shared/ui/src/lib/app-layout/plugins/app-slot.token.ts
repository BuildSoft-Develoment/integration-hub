import { computed, inject, Injectable, InjectionToken, Provider, Type } from '@angular/core';
import { AuthAccessService, AuthCapability } from '@integration-hub/core/services';

/**
 * A widget a plugin (or feature) contributes into a named **slot** of an existing page, so
 * an extension can *enrich* a core page (e.g. add a card to the overview or a tab to a
 * detail view) instead of only adding new screens. See ADR-012.
 */
export interface AppSlotContribution {
  /** Named insertion point, e.g. `overview.widgets`. */
  readonly slot: string;
  /** Standalone component rendered in the slot. */
  readonly component: Type<unknown>;
  readonly source?: string;
  /** Lower renders first. */
  readonly order?: number;
  /** Hidden unless the current user holds this capability (RBAC). */
  readonly requiredCapability?: AuthCapability | null;
}

export const APP_SLOT_CONTRIBUTIONS = new InjectionToken<readonly AppSlotContribution[]>(
  'APP_SLOT_CONTRIBUTIONS'
);

export function provideAppSlotContributions(
  contributions: readonly AppSlotContribution[],
  source = 'app'
): Provider[] {
  return contributions.map((contribution) => ({
    provide: APP_SLOT_CONTRIBUTIONS,
    multi: true,
    useValue: {
      ...contribution,
      source: contribution.source ?? source,
    } satisfies AppSlotContribution,
  }));
}

/**
 * Collects {@link AppSlotContribution}s and resolves those visible in a slot for the
 * current user, ordered. RBAC-filtered by {@link AuthAccessService}.
 */
@Injectable({ providedIn: 'root' })
export class AppSlotRegistry {
  private readonly contributions = inject(APP_SLOT_CONTRIBUTIONS, { optional: true }) ?? [];
  private readonly access = inject(AuthAccessService);

  contributionsFor(slot: string): readonly AppSlotContribution[] {
    return this.contributions
      .filter((contribution) => contribution.slot === slot)
      .filter(
        (contribution) =>
          contribution.requiredCapability == null ||
          this.access.hasCapability(contribution.requiredCapability)
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /** Signal-friendly resolver for a slot (recomputes when auth capabilities change). */
  slot(name: string) {
    return computed(() => this.contributionsFor(name));
  }
}
