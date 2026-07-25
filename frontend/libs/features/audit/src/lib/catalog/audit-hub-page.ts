import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { AuditPackHubComponent } from '@integration-hub/shared/audit-kit';

/**
 * Landing de auditoria (ADR-019, hub de dos niveles): muestra los packs (Generico + estandares) como
 * tarjetas; cada herramienta enlaza a su formulario. Es la ruta `/audit`; el log de eventos vive ahora
 * en `/audit/events`.
 */
@Component({
  selector: 'ih-audit-hub-page',
  standalone: true,
  imports: [AuditPackHubComponent],
  template: `
    <section class="page-grid audit-hub-page ih-no-hint">
      <section class="audit-hub-shell">
        <header class="audit-hub-header">
          <h1 class="ih-section-title">{{ i18n.t('audit.hub.title') }}</h1>
          <p class="ih-muted">{{ i18n.t('audit.hub.subtitle') }}</p>
        </header>
        <ih-audit-pack-hub />
      </section>
    </section>
  `,
  styles: [
    `
      .audit-hub-shell { display: grid; gap: 1.1rem; padding: 1.1rem 1.15rem; }
      .audit-hub-header { display: grid; gap: 0.3rem; }
      .audit-hub-header p { margin: 0; max-width: 70ch; line-height: 1.55; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditHubPageComponent {
  readonly i18n = inject(I18nService);
}
