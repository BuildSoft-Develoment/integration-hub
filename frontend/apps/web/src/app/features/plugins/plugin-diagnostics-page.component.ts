import { HttpClient, HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { I18nService, SKIP_GLOBAL_ERROR_FEEDBACK } from '@integration-hub/core/services';
import { AppPluginRuntimeRegistry } from '@integration-hub/shared/ui';
import { Observable, firstValueFrom } from 'rxjs';

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
        <div class="plugins-section-head">
          <h3 class="ih-section-title">
            {{ i18n.t('plugins.backend') }} ({{ backendInstalled().length }})
          </h3>
          <div class="plugins-actions">
            <button type="button" class="plugins-btn" [disabled]="busy()" (click)="refreshBackend()">
              {{ i18n.t('plugins.refresh') }}
            </button>
            <button type="button" class="plugins-btn" [disabled]="busy()" (click)="reloadBackend()">
              {{ i18n.t('plugins.reload') }}
            </button>
          </div>
        </div>
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
                <th>{{ i18n.t('plugins.col.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (plugin of backendInstalled(); track plugin.id) {
                <tr>
                  <td>{{ plugin.id }}</td>
                  <td>{{ plugin.version }} / SPI {{ plugin.spiVersion }}</td>
                  <td>{{ plugin.transport }}</td>
                  <td>{{ plugin.providedTypes.join(', ') }}</td>
                  <td>
                    <span class="plugin-badge" [attr.data-status]="plugin.status.toLowerCase()">
                      {{ i18n.t('plugins.status.' + plugin.status.toLowerCase()) }}
                    </span>
                  </td>
                  <td>{{ plugin.degradedReason ?? '-' }}</td>
                  <td class="plugins-row-actions">
                    @if (plugin.status === 'ACTIVE') {
                      @if (confirmingDeactivate() === plugin.id) {
                        <button type="button" class="plugins-btn plugins-btn--danger" [disabled]="busy()" (click)="confirmDeactivate(plugin.id)">
                          {{ i18n.t('plugins.confirm') }}
                        </button>
                        <button type="button" class="plugins-btn" [disabled]="busy()" (click)="cancelDeactivate()">
                          {{ i18n.t('plugins.cancel') }}
                        </button>
                      } @else {
                        <button type="button" class="plugins-btn" [disabled]="busy()" (click)="requestDeactivate(plugin.id)">
                          {{ i18n.t('plugins.deactivate') }}
                        </button>
                      }
                    } @else {
                      <button type="button" class="plugins-btn" [disabled]="busy()" (click)="activate(plugin.id)">
                        {{ i18n.t('plugins.activate') }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .plugins-section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
      .plugins-actions { display: flex; gap: 0.5rem; }
      .plugins-btn { padding: 0.25rem 0.6rem; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: var(--surface-1, #fff); color: inherit; cursor: pointer; font-size: 0.85rem; }
      .plugins-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .plugins-btn--danger { border-color: #ef4444; color: #991b1b; font-weight: 500; }
      .plugin-badge { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.78rem; font-weight: 500; }
      .plugin-badge[data-status='active'] { background: #dcfce7; color: #166534; }
      .plugin-badge[data-status='degraded'] { background: #fee2e2; color: #991b1b; }
      .plugin-badge[data-status='untrusted'] { background: #fef9c3; color: #854d0e; }
    `,
  ],
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
  readonly busy = signal(false);
  readonly confirmingDeactivate = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadBackendDiagnostics();
  }

  requestDeactivate(id: string): void {
    this.confirmingDeactivate.set(id);
  }

  cancelDeactivate(): void {
    this.confirmingDeactivate.set(null);
  }

  confirmDeactivate(id: string): void {
    this.confirmingDeactivate.set(null);
    this.deactivate(id);
  }

  refreshBackend(): void {
    void this.loadBackendDiagnostics();
  }

  reloadBackend(): void {
    void this.runAction(() => this.http.post('/api/plugins/reload', {}));
  }

  activate(id: string): void {
    void this.runAction(() => this.http.post(`/api/plugins/${encodeURIComponent(id)}/activate`, {}));
  }

  deactivate(id: string): void {
    void this.runAction(() => this.http.post(`/api/plugins/${encodeURIComponent(id)}/deactivate`, {}));
  }

  private async runAction(action: () => Observable<unknown>): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      await firstValueFrom(action());
      await this.loadBackendDiagnostics();
    } finally {
      this.busy.set(false);
    }
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
