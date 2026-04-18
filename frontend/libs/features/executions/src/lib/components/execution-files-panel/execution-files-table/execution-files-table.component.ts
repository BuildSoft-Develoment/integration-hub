import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { DateTimeService, I18nService } from '@integration-hub/core/services';

import { formatFileSize } from '../../../details/execution-detail.utils';
import { ProcessedSourceFileRecord } from '../../../models/execution.models';

@Component({
  selector: 'ih-execution-files-table',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule],
    templateUrl: './execution-files-table.component.html',
    styleUrl: './execution-files-table.component.css'
})
export class ExecutionFilesTableComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly files = input.required<readonly ProcessedSourceFileRecord[]>();
  readonly selectedKeys = input<readonly string[]>([]);
  readonly allVisibleSelected = input(false);
  readonly partiallySelected = input(false);
  readonly statusClass = input.required<(status: string | null) => string>();
  readonly rowKey = input.required<(file: ProcessedSourceFileRecord) => string>();
  readonly toggleRow = output<{
    file: ProcessedSourceFileRecord;
    checked: boolean;
  }>();
  readonly toggleAllVisible = output<boolean>();

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }

  fileSize(value: number | null): string {
    return formatFileSize(value);
  }
}
