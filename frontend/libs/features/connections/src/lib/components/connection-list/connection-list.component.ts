import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ConnectionProviderDescriptor, ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionManagerService, I18nService } from '@integration-hub/core/services';
import { IconComponent, ResourcePresentation } from '@integration-hub/shared/ui';
import { ConnectionRecord } from '../../models/connection.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-connection-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatChipsModule, MatPaginatorModule, IconComponent],
    templateUrl: './connection-list.component.html',
    styleUrl: './connection-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionListComponent {
  readonly i18n = inject(I18nService);
  private readonly connectionManager = inject(ConnectionManagerService);

  readonly connections = input.required<readonly ConnectionRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedConnectionId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly providerOptions = input<readonly ConnectionProviderDescriptor[]>([]);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly canEdit = input(false);

  readonly selectConnection = output<ConnectionRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();
  readonly selectedIds = input<Set<number>>(new Set());
  readonly isAllSelected = input(false);
  readonly toggleSelection = output<number>();
  readonly toggleSelectAll = output<void>();

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
