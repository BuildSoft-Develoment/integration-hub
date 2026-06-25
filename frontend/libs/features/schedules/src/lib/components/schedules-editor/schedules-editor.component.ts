// @trace RF-001 (programacion: marcar proceso como programado + fijar frecuencia)
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';
import { ScheduleRecord } from '../../models/schedules.models';

@Component({
  selector: 'ih-schedules-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, IconComponent],
    templateUrl: './schedules-editor.component.html',
    styleUrl: './schedules-editor.component.css'
})
export class SchedulesEditorComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly schedule = input<ScheduleRecord | null>(null);
  readonly executing = input(false);
  readonly canOperate = input(false);

  readonly close = output<void>();
  readonly run = output<void>();
  readonly openProcesses = output<void>();

  canRun(): boolean {
    return this.canOperate() && !!this.schedule()?.scheduled;
  }

  showManualGuidance(): boolean {
    return this.canOperate() && !!this.schedule() && !this.schedule()!.scheduled;
  }

  modeLabel(): string {
    return this.schedule()?.scheduled ? this.i18n.t('status.scheduled') : this.i18n.t('status.manual');
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }
}
