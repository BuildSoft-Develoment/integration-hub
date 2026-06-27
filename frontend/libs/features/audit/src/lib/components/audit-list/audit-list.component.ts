// @trace RF-001 (observabilidad: consultar eventos de auditoria por filtros)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent, RelativeTimePipe } from '@integration-hub/shared/ui';

import { AuditPresentationService } from '../../utils/audit-presentation.service';
import { timelineStatusKind } from '../../utils/timeline-format';
import { AuditRecord } from '../../models/audit.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-audit-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule, IconComponent, RelativeTimePipe],
  templateUrl: './audit-list.component.html',
  styleUrl: './audit-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditListComponent {
  readonly i18n = inject(I18nService);
  readonly presentation = inject(AuditPresentationService);

  readonly events = input.required<readonly AuditRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedEventId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectEvent = output<AuditRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  statusLabel(status: string): string {
    return this.presentation.statusLabel(status);
  }

  statusChipClass(status: string): string {
    switch (timelineStatusKind(status)) {
      case 'ok':
        return 'audit-status-ch--ok';
      case 'error':
        return 'audit-status-ch--error';
      default:
        return 'audit-status-ch--pending';
    }
  }

  eventLabel(event: AuditRecord): string {
    return this.presentation.eventLabel(event.eventType);
  }

  taskLabel(event: AuditRecord): string {
    return this.presentation.compactTaskLabel(event);
  }
}
