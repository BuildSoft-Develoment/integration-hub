// @trace RF-003 (programacion: consultar las programaciones vigentes)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { IconComponent, LoadingComponent } from '@integration-hub/shared/ui';
import { ScheduleRecord } from '../../models/schedules.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-schedules-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule, MatPaginatorModule, IconComponent, LoadingComponent],
  styleUrl: './schedules-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './schedules-list.component.html'
})
export class SchedulesListComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly schedules = input.required<readonly ScheduleRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedScheduleId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly selectSchedule = output<ScheduleRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();
  readonly retry = output<void>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }

  readonly focusedIndex = signal(0);

  itemsList(): readonly ScheduleRecord[] {
    return this.schedules();
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
