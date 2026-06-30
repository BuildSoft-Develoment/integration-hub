import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ConnectionProviderDescriptor, ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionManagerService, I18nService } from '@integration-hub/core/services';
import { IconComponent, LoadingComponent, ResourcePresentation } from '@integration-hub/shared/ui';
import { ConnectionRecord } from '../../models/connection.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-connection-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCheckboxModule, MatChipsModule, MatPaginatorModule, IconComponent, LoadingComponent],
    templateUrl: './connection-list.component.html',
    styleUrl: './connection-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionListComponent {
  readonly i18n = inject(I18nService);
  private readonly connectionManager = inject(ConnectionManagerService);
  private readonly host = inject(ElementRef<HTMLElement>);

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

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  providerLabel(type: string): string {
    return this.providerOptions().find((provider) => provider.type === type)?.label ?? type;
  }

  presentation(type: ConnectionProviderType): ResourcePresentation {
    return this.connectionManager.presentation(type);
  }

  readonly focusedIndex = signal(0);

  itemsList(): readonly ConnectionRecord[] {
    return this.connections();
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
