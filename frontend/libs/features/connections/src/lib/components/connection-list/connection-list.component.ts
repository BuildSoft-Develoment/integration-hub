import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ConnectionProviderDescriptor } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ConnectionRecord } from '../../models/connection.models';

@Component({
  selector: 'ih-connection-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
    templateUrl: './connection-list.component.html',
    styleUrl: './connection-list.component.css'
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
