// @trace RF-004 (observabilidad: resumen operativo agregado / overview-summary)
import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { DateTimeService, I18nService } from '@integration-hub/core/services';

interface TableRow {
  primary: string;
  secondary?: string | null;
  status?: string | null;
  timestamp?: string | null;
}

@Component({
  selector: 'ih-overview-table-card',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './overview-table-card.component.css',
    templateUrl: './overview-table-card.component.html'
})
export class OverviewTableCardComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly titleKey = input.required<string>();
  readonly emptyKey = input.required<string>();
  readonly rows = input.required<readonly TableRow[]>();

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }
}
