import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';

type ExecutionStatusFilter = 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_ERRORS';
type ExecutionModeFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';

@Component({
  selector: 'ih-execution-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
    templateUrl: './execution-toolbar.component.html'
})
export class ExecutionToolbarComponent {
  readonly i18n = inject(I18nService);
  readonly search = input('');
  readonly modeFilter = input<ExecutionModeFilter>('ALL');
  readonly statusFilter = input<ExecutionStatusFilter>('ALL');
  readonly searchChange = output<string>();
  readonly modeFilterChange = output<ExecutionModeFilter>();
  readonly statusFilterChange = output<ExecutionStatusFilter>();
}
