// @trace RF-003 (programacion: consultar las programaciones vigentes)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';
import { ScheduleRecord } from '../../models/schedules.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-schedules-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule, IconComponent],
  styleUrl: './schedules-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './schedules-list.component.html'
})
export class SchedulesListComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly schedules = input.required<readonly ScheduleRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedScheduleId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectSchedule = output<ScheduleRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }
}
