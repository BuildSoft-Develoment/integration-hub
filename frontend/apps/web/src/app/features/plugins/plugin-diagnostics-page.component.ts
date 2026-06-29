import { HttpClient, HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { I18nService, SKIP_GLOBAL_ERROR_FEEDBACK } from '@integration-hub/core/services';
import { AppPluginRuntimeRegistry } from '@integration-hub/shared/ui';
import { firstValueFrom } from 'rxjs';

interface BackendPluginDescriptor {
  readonly id: string;
  readonly version: string;
  readonly spiVersion: string;
  readonly providedTypes: readonly string[];
  readonly transport: string;
  readonly trusted: boolean;
  readonly status: 'ACTIVE' | 'DEGRADED' | 'UNTRUSTED' | string;
  readonly degradedReason?: string | null;
}

interface BackendPluginDiagnostics {
  readonly installed: readonly BackendPluginDescriptor[];
  readonly degraded: Record<string, string>;
}

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

      <section>
        <h3 class="ih-section-title">
          {{ i18n.t('plugins.backend') }} ({{ backendInstalled().length }})
        </h3>
        @if (backendLoading()) {
          <p class="ih-muted">{{ i18n.t('plugins.backend.loading') }}</p>
        } @else if (backendError()) {
          <p class="ih-muted">{{ i18n.t('plugins.backend.error') }}</p>
        } @else if (backendInstalled().length === 0) {
          <p class="ih-muted">{{ i18n.t('plugins.empty.backend') }}</p>
        } @else {
          <table class="ih-table">
            <thead>
              <tr>
                <th>{{ i18n.t('plugins.col.id') }}</th>
                <th>{{ i18n.t('plugins.col.version') }}</th>
                <th>{{ i18n.t('plugins.col.transport') }}</th>
                <th>{{ i18n.t('plugins.col.types') }}</th>
                <th>{{ i18n.t('plugins.col.status') }}</th>
                <th>{{ i18n.t('plugins.col.reason') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (plugin of backendInstalled(); track plugin.id) {
                <tr>
                  <td>{{ plugin.id }}</td>
                  <td>{{ plugin.version }} / SPI {{ plugin.spiVersion }}</td>
                  <td>{{ plugin.transport }}</td>
                  <td>{{ plugin.providedTypes.join(', ') }}</td>
                  <td>{{ i18n.t('plugins.status.' + plugin.status.toLowerCase()) }}</td>
                  <td>{{ plugin.degradedReason ?? '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
})
export class PluginDiagnosticsPageComponent implements OnInit {
  private readonly registry = inject(AppPluginRuntimeRegistry);
  private readonly http = inject(HttpClient);
  readonly i18n = inject(I18nService);

  readonly installed = computed(() => this.registry.diagnostics().installed);
  readonly quarantined = computed(() => this.registry.diagnostics().quarantined);
  readonly degraded = computed(() => this.registry.diagnostics().degraded);
  readonly backendLoading = signal(false);
  readonly backendError = signal(false);
  readonly backendDiagnostics = signal<BackendPluginDiagnostics | null>(null);
  readonly backendInstalled = computed(() => this.backendDiagnostics()?.installed ?? []);

  ngOnInit(): void {
    void this.loadBackendDiagnostics();
  }

  private async loadBackendDiagnostics(): Promise<void> {
    this.backendLoading.set(true);
    this.backendError.set(false);
    try {
      this.backendDiagnostics.set(
        await firstValueFrom(this.http.get<BackendPluginDiagnostics>('/api/plugins', {
          context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
        }))
      );
    } catch {
      this.backendError.set(true);
    } finally {
      this.backendLoading.set(false);
    }
  }
}
