import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';
import { auditEventLabel } from '../../utils/audit-event-label';

@Component({
  selector: 'ih-audit-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  styles: [`
    .toolbar-shell {}
  `],
    templateUrl: './audit-toolbar.component.html'
})
export class AuditToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly eventTypeFilter = input('ALL');
  readonly statusFilter = input<'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'COMPLETED_WITH_ERRORS'>('ALL');
  readonly eventTypeOptions = input.required<readonly string[]>();

  readonly searchChange = output<string>();
  readonly eventTypeFilterChange = output<string>();
  readonly statusFilterChange = output<'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'COMPLETED_WITH_ERRORS'>();

  eventTypeLabel(value: string): string {
    return auditEventLabel(this.i18n, value);
  }
}
