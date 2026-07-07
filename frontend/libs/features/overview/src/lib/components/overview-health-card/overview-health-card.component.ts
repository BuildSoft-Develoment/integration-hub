import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';

/** Una métrica del card de salud: etiqueta + valor + tono (color). */
export interface OverviewHealthStat {
  readonly labelKey: string;
  readonly value: number;
  readonly tone: 'ok' | 'error' | 'warn';
}

/**
 * Card de salud genérico y presentacional del overview (DRY): estructura + estilo compartidos por los
 * cards de salud (plugins, backbone async, …). Un nuevo indicador de salud es sólo un `stats` distinto y
 * un enlace, sin duplicar plantilla/CSS (OCP). Los cards "inteligentes" mapean su dominio a este.
 */
@Component({
  selector: 'ih-overview-health-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, IconComponent],
  templateUrl: './overview-health-card.component.html',
  styleUrl: './overview-health-card.component.css',
})
export class OverviewHealthCardComponent {
  readonly i18n = inject(I18nService);

  readonly titleKey = input.required<string>();
  readonly alert = input<'error' | 'warn' | null>(null);
  readonly stats = input.required<readonly OverviewHealthStat[]>();
  readonly linkRoute = input.required<string | readonly string[]>();
  readonly linkLabelKey = input.required<string>();
}
