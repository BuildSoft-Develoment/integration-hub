import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { I18nService } from '@integration-hub/core/services';

type ExecutionStatusFilter = 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_ERRORS';
type ExecutionModeFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';

@Component({
  selector: 'ih-execution-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink],
    templateUrl: './execution-toolbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionToolbarComponent {
  readonly i18n = inject(I18nService);
  readonly search = input('');
  readonly modeFilter = input<ExecutionModeFilter>('ALL');
  readonly statusFilter = input<ExecutionStatusFilter>('ALL');
  readonly startedFrom = input('');
  readonly startedTo = input('');
  readonly loading = input(false);
  readonly searchChange = output<string>();
  readonly modeFilterChange = output<ExecutionModeFilter>();
  readonly statusFilterChange = output<ExecutionStatusFilter>();
  readonly startedFromChange = output<string>();
  readonly startedToChange = output<string>();
  readonly refresh = output<void>();
}
