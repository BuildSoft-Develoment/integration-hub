import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { PageEvent } from '@angular/material/paginator';
import { ConnectionProviderDescriptor, ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionManagerService, I18nService } from '@integration-hub/core/services';
import {
  CatalogListColumn,
  CatalogListComponent,
  IconComponent,
  ResourcePresentation,
} from '@integration-hub/shared/ui';
import { ConnectionRecord } from '../../models/connection.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-connection-list',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatChipsModule, IconComponent, CatalogListComponent],
  templateUrl: './connection-list.component.html',
  styleUrl: './connection-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionListComponent {
  readonly i18n = inject(I18nService);
  private readonly connectionManager = inject(ConnectionManagerService);

  readonly columns: readonly CatalogListColumn[] = [
    { labelKey: 'common.name', sortKey: 'name' },
    { labelKey: 'common.type', sortKey: 'connectionType' },
    { labelKey: 'common.status', sortKey: 'active' },
  ];

  readonly connections = input.required<readonly ConnectionRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedConnectionId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly providerOptions = input<readonly ConnectionProviderDescriptor[]>([]);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly canEdit = input(false);

  readonly selectConnection = output<ConnectionRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();
  readonly retry = output<void>();
  readonly selectedIds = input<Set<number>>(new Set());
  readonly isAllSelected = input(false);
  readonly toggleSelection = output<number>();
  readonly toggleSelectAll = output<void>();

  /** Columns shift right by a checkbox column when bulk selection is enabled. */
  readonly gridColumns = computed(() =>
    this.canEdit()
      ? '3rem minmax(200px, 1.5fr) 0.9fr 0.8fr'
      : 'minmax(200px, 1.5fr) 0.9fr 0.8fr'
  );

  readonly someSelected = computed(() => this.selectedIds().size > 0 && !this.isAllSelected());

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  providerLabel(type: string): string {
    return this.providerOptions().find((provider) => provider.type === type)?.label ?? type;
  }

  presentation(type: ConnectionProviderType): ResourcePresentation {
    return this.connectionManager.presentation(type);
  }
}
