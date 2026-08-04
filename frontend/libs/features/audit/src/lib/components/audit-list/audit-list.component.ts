// @trace spec 004-observabilidad-y-auditoria RF-001 (observabilidad: consultar eventos de auditoria por filtros)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { I18nService, VocabularyTone, vocabularyTone } from '@integration-hub/core/i18n';
import {
  CatalogListColumn,
  CatalogListComponent,
  IconComponent,
  RelativeTimePipe,
} from '@integration-hub/shared/ui';

import { AuditPresentationService } from '../../utils/audit-presentation.service';
import { AuditRecord } from '../../models/audit.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-audit-list',
  standalone: true,
  imports: [CommonModule, IconComponent, RelativeTimePipe, CatalogListComponent],
  templateUrl: './audit-list.component.html',
  styleUrl: './audit-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditListComponent {
  readonly i18n = inject(I18nService);
  readonly presentation = inject(AuditPresentationService);

  readonly columns: readonly CatalogListColumn[] = [
    { labelKey: 'audit.eventType', sortKey: 'eventType' },
    { labelKey: 'common.status', sortKey: 'status' },
    { labelKey: 'audit.createdAt', sortKey: 'createdAt' },
  ];

  readonly events = input.required<readonly AuditRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedEventId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly selectEvent = output<AuditRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();
  readonly retry = output<void>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  statusLabel(status: string): string {
    return this.presentation.statusLabel(status);
  }

  /**
   * El switch propio que habia aqui no contemplaba SUSPENDED ni NEEDS_RECONCILIATION: caian al
   * `default` neutro, indistinguibles de PENDING. Esa copia existia identica en varias pantallas,
   * asi que el agujero se repetia en todas a la vez.
   */
  statusTone(status: string): VocabularyTone {
    return vocabularyTone('executionStatus', status);
  }

  eventLabel(event: AuditRecord): string {
    return this.presentation.eventLabel(event.eventType);
  }

  taskLabel(event: AuditRecord): string {
    return this.presentation.compactTaskLabel(event);
  }
}
