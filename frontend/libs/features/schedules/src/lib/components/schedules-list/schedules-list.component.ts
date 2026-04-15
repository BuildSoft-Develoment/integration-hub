import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { ScheduleRecord } from '../../schedules.models';

@Component({
  selector: 'ih-schedules-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
  template: `
    <div class="list-card ih-catalog-list">
      <div class="table-head ih-catalog-table-head">
        <span>{{ i18n.t('common.name') }}</span>
        <span>{{ i18n.t('processes.mode') }}</span>
        <span>{{ i18n.t('schedules.nextRun') }}</span>
      </div>

      <div class="table-body ih-catalog-table-body ih-thin-scroll">
        @for (schedule of schedules(); track schedule.id) {
          <button type="button" class="table-row ih-catalog-table-row" [class.table-row--selected]="selectedScheduleId() === schedule.id" [class.ih-catalog-table-row--selected]="selectedScheduleId() === schedule.id" (click)="selectSchedule.emit(schedule)">
            <div class="row-primary ih-catalog-row-primary">
              <div class="row-avatar ih-catalog-row-avatar">{{ schedule.name.slice(0, 1).toUpperCase() }}</div>
              <div class="row-copy ih-catalog-row-copy">
                <strong>{{ schedule.name }}</strong>
                <small>ID {{ schedule.id }}</small>
              </div>
            </div>

            <div class="row-type ih-catalog-row-meta">
              <mat-chip-set>
                <mat-chip>{{ schedule.scheduled ? i18n.t('status.scheduled') : i18n.t('status.manual') }}</mat-chip>
              </mat-chip-set>
            </div>

            <div class="row-status ih-catalog-row-meta">{{ formatDate(schedule.nextRunAt) }}</div>
          </button>
        } @empty {
          <div class="empty-state ih-catalog-empty-state ih-muted">{{ i18n.t('schedules.noData') }}</div>
        }
      </div>

      <mat-paginator class="list-paginator ih-catalog-paginator" [length]="totalLength()" [pageIndex]="pageIndex()" [pageSize]="pageSize()" [pageSizeOptions]="pageSizeOptions()" [hidePageSize]="false" [showFirstLastButtons]="false" (page)="onPageChange($event)" />
    </div>
  `,
  styles: [`
    .row-type,.row-status { display:flex; align-items:center; }
    .row-status { font-size:0.86rem; color:var(--ih-text-soft); }
    @media (max-height: 700px) and (min-width: 761px) {
      .row-copy small, .row-status { font-size:0.8rem; }
    }
  `],
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
