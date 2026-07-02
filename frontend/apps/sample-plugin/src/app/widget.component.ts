import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent, StatusBadgeComponent } from '@integration-hub/plugin-ui-kit';

/**
 * Exposed remote widget. Consumes the versioned UI kit package
 * (`@integration-hub/plugin-ui-kit`): `ih-status-badge`, `ih-icon` and the design tokens, so
 * an externally installed plugin renders with the native look-and-feel. Because the kit is a
 * published, versioned package, it can be shared as a host singleton (see federation.config.js)
 * instead of being bundled per-remote.
 */
@Component({
  selector: 'app-sample-plugin-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, StatusBadgeComponent],
  template: `
    <section class="sample-plugin-widget">
      <header class="sample-plugin-widget__head">
        <ih-icon name="shield" [size]="20" />
        <h3>Sample remote plugin</h3>
        <ih-status-badge status="success">Verified</ih-status-badge>
      </header>
      <p>
        Loaded over Native Federation and verified by the ADR-013 chain, rendered with the
        platform UI kit.
      </p>
    </section>
  `,
  styles: [
    `
      .sample-plugin-widget {
        padding: var(--ih-space-4, 1rem);
        border: 1px solid var(--ih-border-strong, #ccc);
        border-radius: var(--ih-radius-md, 8px);
        background: var(--ih-surface-alt);
        color: var(--ih-text);
      }
      .sample-plugin-widget__head {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .sample-plugin-widget__head h3 {
        margin: 0;
        flex: 1;
      }
    `,
  ],
})
export class SamplePluginWidgetComponent {}
