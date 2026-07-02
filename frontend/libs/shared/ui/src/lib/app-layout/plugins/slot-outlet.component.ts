import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AppSlotRegistry } from './app-slot.token';

/**
 * Renders every {@link AppSlotContribution} registered for a named slot, in order and
 * RBAC-filtered. Drop it into a page to expose an extension point:
 * {@code <ih-slot name="overview.widgets" />}.
 */
@Component({
  selector: 'ih-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  template: `
    @for (contribution of contributions(); track contribution.component) {
      <ng-container [ngComponentOutlet]="contribution.component" />
    }
  `,
})
export class SlotOutletComponent {
  private readonly registry = inject(AppSlotRegistry);

  readonly name = input.required<string>();

  readonly contributions = computed(() => this.registry.contributionsFor(this.name()));
}
