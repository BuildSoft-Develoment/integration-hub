import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';

import { AuditPresentationService } from '../../utils/audit-presentation.service';
import { AuditRecord } from '../../models/audit.models';

@Component({
  selector: 'ih-audit-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterLink, IconComponent],
    templateUrl: './audit-editor.component.html',
    styleUrl: './audit-editor.component.css'
})
export class AuditEditorComponent {
  readonly i18n = inject(I18nService);
  readonly presentation = inject(AuditPresentationService);

  readonly event = input<AuditRecord | null>(null);
  readonly close = output<void>();

  readonly prettyPayload = computed(() => {
    const value = this.event()?.payloadJson;
    if (!value) {
      return '';
    }
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  });

  statusLabel(status: string): string {
    return this.presentation.statusLabel(status);
  }

  formatDate(value: string | null): string {
    return this.presentation.formatDate(value);
  }

  eventLabel(event: AuditRecord): string {
    return this.presentation.eventLabel(event.eventType);
  }

  taskLabel(event: AuditRecord): string {
    return this.presentation.taskLabel(event);
  }

  taskTypeDescription(taskType: string | null): string {
    return this.presentation.taskTypeDescription(taskType);
  }
}
