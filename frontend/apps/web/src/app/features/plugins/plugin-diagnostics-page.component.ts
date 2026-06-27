import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { AppPluginRuntimeRegistry } from '@integration-hub/shared/ui';

@Component({
  selector: 'app-plugin-diagnostics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-grid plugin-diagnostics-page">
      <header>
        <h2 class="ih-section-title">{{ i18n.t('plugins.title') }}</h2>
        <p class="ih-muted">{{ i18n.t('plugins.subtitle') }}</p>
      </header>

      <section>
        <h3 class="ih-section-title">
          {{ i18n.t('plugins.installed') }} ({{ installed().length }})
        </h3>
        @if (installed().length === 0) {
          <p class="ih-muted">{{ i18n.t('plugins.empty.installed') }}</p>
        } @else {
          <table class="ih-table">
            <thead>
              <tr>
                <th>{{ i18n.t('plugins.col.id') }}</th>
                <th>{{ i18n.t('plugins.col.name') }}</th>
                <th>{{ i18n.t('plugins.col.version') }}</th>
                <th>{{ i18n.t('plugins.col.origin') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (plugin of installed(); track plugin.id) {
                <tr>
                  <td>{{ plugin.id }}</td>
                  <td>{{ plugin.displayName }}</td>
                  <td>{{ plugin.version }}</td>
                  <td>{{ i18n.t('plugins.origin.' + plugin.origin) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section>
        <h3 class="ih-section-title">
          {{ i18n.t('plugins.quarantined') }} ({{ quarantined().length }})
        </h3>
        @if (quarantined().length === 0) {
          <p class="ih-muted">{{ i18n.t('plugins.empty.quarantined') }}</p>
        } @else {
          <table class="ih-table">
            <thead>
              <tr>
                <th>{{ i18n.t('plugins.col.id') }}</th>
                <th>{{ i18n.t('plugins.col.reason') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (plugin of quarantined(); track plugin.id) {
                <tr>
                  <td>{{ plugin.id }}</td>
                  <td>{{ plugin.reason }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section>
        <h3 class="ih-section-title">
          {{ i18n.t('plugins.degraded') }} ({{ degraded().length }})
        </h3>
        @if (degraded().length === 0) {
          <p class="ih-muted">{{ i18n.t('plugins.empty.degraded') }}</p>
        } @else {
          <table class="ih-table">
            <thead>
              <tr>
                <th>{{ i18n.t('plugins.col.id') }}</th>
                <th>{{ i18n.t('plugins.col.reason') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (plugin of degraded(); track plugin.id) {
                <tr>
                  <td>{{ plugin.id }}</td>
                  <td>{{ plugin.reason }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
})
export class PluginDiagnosticsPageComponent {
  private readonly registry = inject(AppPluginRuntimeRegistry);
  readonly i18n = inject(I18nService);

  readonly installed = computed(() => this.registry.diagnostics().installed);
  readonly quarantined = computed(() => this.registry.diagnostics().quarantined);
  readonly degraded = computed(() => this.registry.diagnostics().degraded);
}
