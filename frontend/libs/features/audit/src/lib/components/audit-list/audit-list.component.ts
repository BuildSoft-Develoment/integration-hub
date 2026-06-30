// @trace RF-001 (observabilidad: consultar eventos de auditoria por filtros)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent, LoadingComponent, RelativeTimePipe } from '@integration-hub/shared/ui';

import { AuditPresentationService } from '../../utils/audit-presentation.service';
import { timelineStatusKind } from '../../utils/timeline-format';
import { AuditRecord } from '../../models/audit.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-audit-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule, MatPaginatorModule, IconComponent, LoadingComponent, RelativeTimePipe],
  templateUrl: './audit-list.component.html',
  styleUrl: './audit-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditListComponent {
  readonly i18n = inject(I18nService);
  readonly presentation = inject(AuditPresentationService);
  private readonly host = inject(ElementRef<HTMLElement>);

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

  readonly focusedIndex = signal(0);

  itemsList(): readonly AuditRecord[] {
    return this.events();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const items = this.itemsList();
    if (items.length === 0) { return; }
    let idx = this.focusedIndex();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      idx = Math.max(idx - 1, 0);
    } else {
      return;
    }
    this.focusedIndex.set(idx);
    const row = this.host.nativeElement.querySelector(`[data-row-index="${idx}"]`) as HTMLElement | null;
    row?.focus();
  }
}
