import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ConnectionProviderDescriptor } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ConnectionRecord } from '../../connection.models';

@Component({
  selector: 'ih-connection-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
  template: `
    <div class="list-card ih-catalog-list">
      <div class="table-head ih-catalog-table-head">
        <span>{{ i18n.t('common.name') }}</span>
        <span>{{ i18n.t('common.type') }}</span>
        <span>{{ i18n.t('common.status') }}</span>
      </div>

      <div class="table-body ih-catalog-table-body ih-thin-scroll">
        @for (connection of connections(); track connection.id) {
          <button
            type="button"
            class="table-row ih-catalog-table-row"
            [class.table-row--selected]="selectedConnectionId() === connection.id"
            [class.ih-catalog-table-row--selected]="selectedConnectionId() === connection.id"
            (click)="selectConnection.emit(connection)"
          >
            <div class="row-primary ih-catalog-row-primary">
              <div class="row-avatar ih-catalog-row-avatar">{{ connection.name.slice(0, 1).toUpperCase() }}</div>
              <div class="row-copy ih-catalog-row-copy">
                <strong>{{ connection.name }}</strong>
                <small>ID {{ connection.id }}</small>
              </div>
            </div>

            <div class="row-type ih-catalog-row-meta">
              <mat-chip-set>
                <mat-chip>{{ providerLabel(connection.connectionType) }}</mat-chip>
              </mat-chip-set>
            </div>

            <div class="row-status" [class.row-status--inactive]="!connection.active">
              <span class="status-dot"></span>
              {{ connection.active ? i18n.t('status.active') : i18n.t('status.inactive') }}
            </div>
          </button>
        } @empty {
          <div class="empty-state ih-catalog-empty-state ih-muted">{{ i18n.t('connections.noData') }}</div>
        }
      </div>

      <mat-paginator
        class="list-paginator ih-catalog-paginator"
        [length]="totalLength()"
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="pageSizeOptions()"
        [hidePageSize]="false"
        [showFirstLastButtons]="false"
        (page)="onPageChange($event)"
      />
    </div>
  `,
  styles: [
    `
      .row-type,
      .row-status {
        display: flex;
        align-items: center;
      }
      .row-status {
        gap: 0.45rem;
        color: #166534;
        font-size: 0.86rem;
        font-weight: 600;
      }
      .row-status--inactive {
        color: #b45309;
      }
      .status-dot {
        width: 0.52rem;
        height: 0.52rem;
        border-radius: 999px;
        background: currentColor;
      }
      @media (max-height: 700px) and (min-width: 761px) {
        .row-copy small,
        .row-status {
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class ConnectionListComponent {
  readonly i18n = inject(I18nService);

  readonly connections = input.required<readonly ConnectionRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedConnectionId = input<number | null>(null);
  readonly providerOptions = input<readonly ConnectionProviderDescriptor[]>([]);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectConnection = output<ConnectionRecord>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  providerLabel(type: string): string {
    return this.providerOptions().find((provider) => provider.type === type)?.label ?? type;
  }
}
