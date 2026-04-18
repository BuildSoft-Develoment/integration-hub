import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { ScheduleRecord } from '../../models/schedules.models';

@Component({
  selector: 'ih-schedules-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
  styles: [`
    :host { display:block; min-height:0; height:100%; }
    .list-card { min-height:100%; height:100%; display:grid; grid-template-rows:auto minmax(0,1fr) auto; }
    .table-body { min-height:0; }
    .row-type,.row-status { display:flex; align-items:center; }
    .row-status { font-size:0.86rem; color:var(--ih-text-soft); }
    .row-copy small { color:var(--ih-text-soft); }
  `],
    templateUrl: './schedules-list.component.html'
})
export class SchedulesListComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly schedules = input.required<readonly ScheduleRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedScheduleId = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectSchedule = output<ScheduleRecord>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }
}
