// @trace RF-003 (procesos: activar/desactivar proceso para habilitar ejecucion)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';

type ScheduleFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'ih-process-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  styles: [
    `
      .create-button { justify-self: start; }
    `,
  ],
    templateUrl: './process-toolbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly scheduleFilter = input<ScheduleFilter>('ALL');
  readonly statusFilter = input<StatusFilter>('ALL');
  readonly canEdit = input(false);

  readonly searchChange = output<string>();
  readonly scheduleFilterChange = output<ScheduleFilter>();
  readonly statusFilterChange = output<StatusFilter>();
  readonly create = output<void>();
}
