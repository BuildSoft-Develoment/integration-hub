// @trace spec 004-observabilidad-y-auditoria RF-004 (observabilidad: resumen operativo agregado / overview-summary)
import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { resolveVocabulary, vocabularyTone, VocabularyTone } from '@integration-hub/core/i18n';
import { OverviewTableRow, OverviewVocabularyValue } from '../../models/overview-row.model';

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
  // Antes habia una interfaz `TableRow` local, calcada del modelo pero con los campos opcionales.
  // Esa copia es lo que dejo pasar el estado como cadena suelta; ahora la tarjeta acepta la unica
  // forma que el store sabe construir.
  readonly rows = input.required<readonly OverviewTableRow[]>();

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }

  statusLabel(status: OverviewVocabularyValue): string {
    return resolveVocabulary(this.i18n, status.kind, status.value);
  }

  /**
   * El tono ya no se decide aqui. Habia un `switch` propio, copiado entre pantallas, y ninguna de
   * las copias contemplaba `NEEDS_RECONCILIATION`: por eso salia gris — indistinguible de
   * `PENDING` — en todas a la vez.
   */
  statusTone(status: OverviewVocabularyValue): VocabularyTone {
    return vocabularyTone(status.kind, status.value);
  }
}
