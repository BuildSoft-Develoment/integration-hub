import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-schedules-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
    templateUrl: './schedules-toolbar.component.html',
    styleUrl: './schedules-toolbar.component.css'
})
export class SchedulesToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly modeFilter = input<'ALL' | 'SCHEDULED' | 'MANUAL'>('ALL');
  readonly statusFilter = input<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  readonly searchChange = output<string>();
  readonly modeFilterChange = output<'ALL' | 'SCHEDULED' | 'MANUAL'>();
  readonly statusFilterChange = output<'ALL' | 'ACTIVE' | 'INACTIVE'>();
  readonly refresh = output<void>();
}
