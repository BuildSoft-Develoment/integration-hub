import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent, StatusBadgeComponent } from '@integration-hub/plugin-ui-kit';

/**
 * Widget remoto expuesto (`./Widget`). Consume el paquete versionado
 * `@integration-hub/plugin-ui-kit` (instalado desde el tarball local) para verse nativo:
 * `ih-icon`, `ih-status-badge` y los design tokens de la plataforma. Emparejado con los
 * backends gRPC DEMO_TRANSFORM_* de este mismo ejemplo.
 */
@Component({
  selector: 'app-demo-transform-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, StatusBadgeComponent],
  template: `
    <section class="demo-widget">
      <header class="demo-widget__head">
        <ih-icon name="shield" [size]="20" />
        <h3>Demo Transform</h3>
        <ih-status-badge status="success">Verified</ih-status-badge>
      </header>
      <p>
        Plugin externo independiente cargado por Native Federation y verificado por la cadena
        ADR-013. El backend gRPC (Java / Node / Python) resuelve el task
        <code>DEMO_TRANSFORM_*</code>.
      </p>
    </section>
  `,
  styles: [
    `
      .demo-widget {
        padding: var(--ih-space-4, 1rem);
        border: 1px solid var(--ih-border-strong, #ccc);
        border-radius: var(--ih-radius-md, 8px);
        background: var(--ih-surface-alt, #fff);
        color: var(--ih-text, #111);
      }
      .demo-widget__head {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .demo-widget__head h3 {
        margin: 0;
        flex: 1;
      }
    `,
  ],
})
export class DemoTransformWidgetComponent {}
