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

interface BackendPluginVersion {
  readonly id: string;
  readonly version: string;
  readonly spiVersion: string;
  readonly transport: string;
  readonly trusted: boolean;
  readonly active: boolean;
  readonly channel?: string | null;
  readonly pinned: boolean;
}

interface BackendPluginDiagnostics {
  readonly installed: readonly BackendPluginDescriptor[];
  readonly versions?: readonly BackendPluginVersion[];
  readonly degraded: Record<string, string>;
}

interface BackendCanaryMetric {
  readonly pluginId: string;
  readonly version: string;
  readonly totalSamples: number;
  readonly failures: number;
  readonly failureRatio: number;
  readonly windowHours: number;
  readonly minSamples: number;
  readonly maxFailureRatio: number;
  readonly promotable: boolean;
  readonly blockReason?: string | null;
  readonly trend?: readonly number[] | null;
}

type FrontendPluginStatus = 'installed' | 'quarantined' | 'degraded';
type FrontendPluginFilter = 'all' | FrontendPluginStatus;

interface FrontendPluginRow {
  readonly key: string;
  readonly id: string;
  readonly status: FrontendPluginStatus;
  readonly badge: string;
  readonly statusLabel: string;
  readonly detail: string;
}

@Component({
  selector: 'app-plugin-diagnostics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-grid plugin-diagnostics-page" [attr.aria-busy]="busy()">
      <header>
        <h2 class="ih-section-title">{{ i18n.t('plugins.title') }}</h2>
        <p class="ih-muted">{{ i18n.t('plugins.subtitle') }}</p>
      </header>

      <section>
        <div class="plugins-section-head">
          <h3 class="ih-section-title">
            {{ i18n.t('plugins.registry') }} ({{ frontendRows().length }})
          </h3>
          <div class="plugins-filters" role="group" [attr.aria-label]="i18n.t('plugins.registry')">
            @for (chip of frontendFilters; track chip.value) {
              <button
                type="button"
                class="plugins-chip"
                [class.plugins-chip--active]="frontendFilter() === chip.value"
                [attr.aria-pressed]="frontendFilter() === chip.value"
                (click)="frontendFilter.set(chip.value)"
              >
                {{ i18n.t(chip.label) }} ({{ chip.count() }})
              </button>
            }
          </div>
        </div>
        @if (filteredFrontendRows().length === 0) {
          <p class="ih-muted">
            {{
              frontendRows().length === 0
                ? i18n.t('plugins.empty.installed')
                : i18n.t('plugins.empty.filtered')
            }}
          </p>
        } @else {
          <table class="ih-table">
            <caption class="sr-only">{{ i18n.t('plugins.registry') }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ i18n.t('plugins.col.id') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.status') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.detail') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (row of filteredFrontendRows(); track row.key) {
                <tr>
                  <td>{{ row.id }}</td>
                  <td>
                    <span class="plugin-badge" [attr.data-status]="row.badge">
                      {{ i18n.t(row.statusLabel) }}
                    </span>
                  </td>
                  <td>{{ row.detail }}</td>
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
          <p class="ih-muted" role="status" aria-live="polite">{{ i18n.t('plugins.backend.loading') }}</p>
        } @else if (backendError()) {
          <p class="ih-muted" role="alert">{{ i18n.t('plugins.backend.error') }}</p>
        } @else if (backendInstalled().length === 0) {
          <p class="ih-muted">{{ i18n.t('plugins.empty.backend') }}</p>
        } @else {
          <table class="ih-table">
            <caption class="sr-only">{{ i18n.t('plugins.backend') }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ i18n.t('plugins.col.id') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.version') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.transport') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.types') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.status') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.reason') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.actions') }}</th>
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

      <section>
        <h3 class="ih-section-title">
          {{ i18n.t('plugins.versions') }} ({{ backendVersions().length }})
        </h3>
        @if (backendVersions().length === 0) {
          <p class="ih-muted">{{ i18n.t('plugins.empty.versions') }}</p>
        } @else {
          <table class="ih-table">
            <caption class="sr-only">{{ i18n.t('plugins.versions') }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ i18n.t('plugins.col.id') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.version') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.channel') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.status') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (v of backendVersions(); track v.id + ':' + v.version) {
                <tr>
                  <td>{{ v.id }}</td>
                  <td>{{ v.version }} / SPI {{ v.spiVersion }}</td>
                  <td>{{ v.channel ?? '-' }}</td>
                  <td>
                    <span class="plugin-badge" [attr.data-status]="v.active ? 'active' : 'inactive'">
                      {{ i18n.t(v.active ? 'plugins.version.active' : 'plugins.version.inactive') }}
                    </span>
                  </td>
                  <td>
                    @if (!v.active) {
                      <button type="button" class="plugins-btn" [disabled]="busy()" (click)="activateVersion(v.id, v.version)">
                        {{ i18n.t('plugins.activateVersion') }}
                      </button>
                    } @else {
                      -
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section>
        <div class="plugins-section-head">
          <h3 class="ih-section-title">
            {{ i18n.t('plugins.canary') }} ({{ canaryMetrics().length }})
          </h3>
          <div class="plugins-actions">
            <button type="button" class="plugins-btn" [disabled]="canaryLoading()" (click)="refreshCanary()">
              {{ i18n.t('plugins.refresh') }}
            </button>
          </div>
        </div>
        @if (canaryLoading()) {
          <p class="ih-muted" role="status" aria-live="polite">{{ i18n.t('plugins.canary.loading') }}</p>
        } @else if (canaryError()) {
          <p class="ih-muted" role="alert">{{ i18n.t('plugins.canary.error') }}</p>
        } @else if (canaryMetrics().length === 0) {
          <p class="ih-muted">{{ i18n.t('plugins.empty.canary') }}</p>
        } @else {
          <table class="ih-table">
            <caption class="sr-only">{{ i18n.t('plugins.canary') }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ i18n.t('plugins.col.id') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.version') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.samples') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.failures') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.failureRatio') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.trend') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.status') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.reason') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (m of canaryMetrics(); track m.pluginId + ':' + m.version) {
                <tr>
                  <td>{{ m.pluginId }}</td>
                  <td>{{ m.version }}</td>
                  <td>{{ m.totalSamples }} / {{ m.minSamples }}</td>
                  <td>{{ m.failures }}</td>
                  <td>{{ (m.failureRatio * 100).toFixed(1) }}%</td>
                  <td>
                    @if (m.trend && m.trend.length > 1) {
                      <svg
                        class="canary-spark"
                        viewBox="0 0 100 24"
                        preserveAspectRatio="none"
                        role="img"
                        [style.color]="m.promotable ? 'var(--ih-status-success)' : 'var(--ih-status-error)'"
                        [attr.aria-label]="
                          i18n.t('plugins.col.trend') + ': ' + (m.failureRatio * 100).toFixed(1) + '%'
                        "
                      >
                        <polyline
                          [attr.points]="sparkline(m.trend)"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linejoin="round"
                          stroke-linecap="round"
                        />
                      </svg>
                    } @else {
                      <span class="ih-muted">-</span>
                    }
                  </td>
                  <td>
                    <span class="plugin-badge" [attr.data-status]="m.promotable ? 'active' : 'inactive'">
                      {{ i18n.t(m.promotable ? 'plugins.canary.promotable' : 'plugins.canary.blocked') }}
                    </span>
                  </td>
                  <td>{{ m.blockReason ? i18n.t('plugins.canary.reason.' + m.blockReason) : '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section>
        <h3 class="ih-section-title">{{ i18n.t('plugins.marketplace') }}</h3>
        <div class="plugins-market-form">
          <input
            #catUrl
            type="url"
            class="plugins-input"
            [value]="marketplaceCatalogUrl()"
            (input)="marketplaceCatalogUrl.set(catUrl.value)"
            [attr.aria-label]="i18n.t('plugins.marketplace.url')"
            [placeholder]="i18n.t('plugins.marketplace.url')"
          />
          <input
            #plgId
            class="plugins-input"
            [value]="marketplacePluginId()"
            (input)="marketplacePluginId.set(plgId.value)"
            [attr.aria-label]="i18n.t('plugins.marketplace.plugin')"
            [placeholder]="i18n.t('plugins.marketplace.plugin')"
          />
          <button type="button" class="plugins-btn" [disabled]="busy()" (click)="previewMarketplace()">
            {{ i18n.t('plugins.marketplace.preview') }}
          </button>
        </div>
        @if (marketplaceError()) {
          <p class="ih-muted" role="alert">{{ i18n.t('plugins.marketplace.error') }}</p>
        }
        @if (marketplacePreview(); as preview) {
          <table class="ih-table" role="status" aria-live="polite">
            <tbody>
              <tr>
                <td>{{ preview.id }}</td>
                <td>{{ preview.version }} / SPI {{ preview.spiVersion }}</td>
                <td>{{ preview.transport }}</td>
                <td>
                  <span class="plugin-badge" [attr.data-status]="preview.status.toLowerCase()">
                    {{ i18n.t('plugins.status.' + preview.status.toLowerCase()) }}
                  </span>
                </td>
                <td>
                  <button type="button" class="plugins-btn" [disabled]="busy()" (click)="installMarketplace()">
                    {{ i18n.t('plugins.marketplace.install') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        }
      </section>

      <section>
        <h3 class="ih-section-title">{{ i18n.t('plugins.ui.title') }}</h3>
        <p class="ih-muted">{{ i18n.t('plugins.ui.hint') }}</p>
        <div class="plugins-ui-form">
          <textarea
            #uiManifest
            class="plugins-input plugins-textarea"
            rows="6"
            [value]="uiManifestJson()"
            (input)="uiManifestJson.set(uiManifest.value)"
            [attr.aria-label]="i18n.t('plugins.ui.manifest')"
            [placeholder]="i18n.t('plugins.ui.manifest')"
          ></textarea>
          <button type="button" class="plugins-btn" (click)="previewUiManifest()">
            {{ i18n.t('plugins.ui.preview') }}
          </button>
        </div>
        @if (uiInvalidJson()) {
          <p class="ih-muted" role="alert">{{ i18n.t('plugins.ui.invalidJson') }}</p>
        }
        @if (uiPreviewResult(); as result) {
          @if (result.accepted) {
            <p class="ih-muted" role="status" aria-live="polite">
              <span class="plugin-badge" data-status="active">{{ i18n.t('plugins.ui.acceptedBadge') }}</span>
              {{ i18n.t('plugins.ui.accepted', { id: result.id }) }}
            </p>
            <button type="button" class="plugins-btn" [disabled]="busy()" (click)="installToCatalog()">
              {{ i18n.t('plugins.ui.install') }}
            </button>
          } @else {
            <p class="ih-muted" role="alert">
              <span class="plugin-badge" data-status="degraded">{{ i18n.t('plugins.ui.rejectedBadge') }}</span>
              {{ i18n.t('plugins.ui.rejected', { reason: result.reason }) }}
            </p>
          }
        }

        <h4 class="ih-section-subtitle">
          {{ i18n.t('plugins.ui.installed') }} ({{ uiCatalog().length }})
        </h4>
        @if (uiCatalog().length === 0) {
          <p class="ih-muted">{{ i18n.t('plugins.ui.empty') }}</p>
        } @else {
          <table class="ih-table">
            <caption class="sr-only">{{ i18n.t('plugins.ui.installed') }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ i18n.t('plugins.col.id') }}</th>
                <th scope="col">{{ i18n.t('plugins.col.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of uiCatalog(); track entry.id) {
                <tr>
                  <td>{{ entry.id }}</td>
                  <td>
                    <button type="button" class="plugins-btn plugins-btn--danger" (click)="removeFromCatalog(entry.id)">
                      {{ i18n.t('plugins.ui.remove') }}
                    </button>
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
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      .plugins-section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
      .plugins-actions { display: flex; gap: 0.5rem; }
      .plugins-filters { display: flex; flex-wrap: wrap; gap: 0.375rem; }
      .plugins-chip { padding: 0.2rem 0.7rem; border: 1px solid var(--ih-border-strong); border-radius: var(--ih-radius-pill); background: transparent; color: var(--ih-text-soft); cursor: pointer; font-size: var(--ih-font-size-xs); font-weight: var(--ih-font-weight-medium); }
      .plugins-chip:hover { border-color: var(--ih-accent); color: var(--ih-text); }
      .plugins-chip--active { background: var(--ih-status-info-bg); border-color: var(--ih-accent); color: var(--ih-accent-strong); }
      .plugins-chip:focus-visible,
      .plugins-btn:focus-visible,
      .plugins-input:focus-visible { outline: 2px solid var(--ih-accent); outline-offset: 2px; }
      .plugins-btn { padding: 0.25rem 0.6rem; border: 1px solid var(--ih-border-strong); border-radius: var(--ih-radius-sm); background: var(--ih-surface-alt); color: inherit; cursor: pointer; font-size: var(--ih-font-size-sm); }
      .plugins-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .plugins-btn--danger { border-color: var(--ih-status-error); color: var(--ih-status-error); font-weight: var(--ih-font-weight-medium); }
      .plugins-market-form { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
      .plugins-input { padding: 0.3rem 0.5rem; border: 1px solid var(--ih-border-strong); border-radius: var(--ih-radius-sm); background: var(--ih-surface-alt); color: inherit; min-width: 14rem; }
      .plugins-ui-form { display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
      .plugins-textarea { width: 100%; max-width: 46rem; font-family: var(--ih-font-mono); font-size: var(--ih-font-size-xs); resize: vertical; }
      .canary-spark { display: inline-block; width: 90px; height: 22px; vertical-align: middle; }
      .plugin-badge { display: inline-block; padding: 0.1rem 0.5rem; border-radius: var(--ih-radius-pill); font-size: var(--ih-font-size-xs); font-weight: var(--ih-font-weight-medium); }
      .plugin-badge[data-status='active'] { background: var(--ih-status-success-bg); color: var(--ih-status-success); }
      .plugin-badge[data-status='degraded'] { background: var(--ih-status-error-bg); color: var(--ih-status-error); }
      .plugin-badge[data-status='untrusted'] { background: var(--ih-status-warning-bg); color: var(--ih-status-warning); }
      .plugin-badge[data-status='inactive'] { background: color-mix(in srgb, var(--ih-status-neutral) 14%, transparent); color: var(--ih-status-neutral); }
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

  readonly frontendFilter = signal<FrontendPluginFilter>('all');

  readonly frontendRows = computed<readonly FrontendPluginRow[]>(() => {
    const installed = this.installed().map<FrontendPluginRow>((p) => ({
      key: `installed:${p.id}`,
      id: p.id,
      status: 'installed',
      badge: 'active',
      statusLabel: 'plugins.installed',
      detail: `${p.displayName} · ${p.version} · ${this.i18n.t('plugins.origin.' + p.origin)}`,
    }));
    const quarantined = this.quarantined().map<FrontendPluginRow>((p) => ({
      key: `quarantined:${p.id}`,
      id: p.id,
      status: 'quarantined',
      badge: 'degraded',
      statusLabel: 'plugins.quarantined',
      detail: p.reason,
    }));
    const degraded = this.degraded().map<FrontendPluginRow>((p) => ({
      key: `degraded:${p.id}`,
      id: p.id,
      status: 'degraded',
      badge: 'untrusted',
      statusLabel: 'plugins.degraded',
      detail: p.reason,
    }));
    return [...installed, ...quarantined, ...degraded];
  });

  readonly filteredFrontendRows = computed<readonly FrontendPluginRow[]>(() => {
    const filter = this.frontendFilter();
    const rows = this.frontendRows();
    return filter === 'all' ? rows : rows.filter((row) => row.status === filter);
  });

  readonly frontendFilters: ReadonlyArray<{
    value: FrontendPluginFilter;
    label: string;
    count: () => number;
  }> = [
    { value: 'all', label: 'plugins.filter.all', count: () => this.frontendRows().length },
    { value: 'installed', label: 'plugins.installed', count: () => this.installed().length },
    { value: 'quarantined', label: 'plugins.quarantined', count: () => this.quarantined().length },
    { value: 'degraded', label: 'plugins.degraded', count: () => this.degraded().length },
  ];
  readonly backendLoading = signal(false);
  readonly backendError = signal(false);
  readonly backendDiagnostics = signal<BackendPluginDiagnostics | null>(null);
  readonly backendInstalled = computed(() => this.backendDiagnostics()?.installed ?? []);
  readonly backendVersions = computed(() => this.backendDiagnostics()?.versions ?? []);
  readonly busy = signal(false);
  readonly confirmingDeactivate = signal<string | null>(null);
  readonly canaryLoading = signal(false);
  readonly canaryError = signal(false);
  readonly canaryMetrics = signal<readonly BackendCanaryMetric[]>([]);

  readonly uiCatalog = signal<readonly { id: string }[]>([]);

  ngOnInit(): void {
    void this.loadBackendDiagnostics();
    void this.loadCanaryMetrics();
    void this.loadUiCatalog();
  }

  private async loadUiCatalog(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ manifests?: { id?: string }[] }>('/api/plugins/ui-catalog', {
          context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
        })
      );
      this.uiCatalog.set(
        (response.manifests ?? [])
          .filter((manifest): manifest is { id: string } => !!manifest?.id)
          .map((manifest) => ({ id: manifest.id }))
      );
    } catch {
      this.uiCatalog.set([]);
    }
  }

  async installToCatalog(): Promise<void> {
    const result = this.uiPreviewResult();
    const raw = this.uiManifestJson().trim();
    if (!result?.accepted || !raw) {
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.uiInvalidJson.set(true);
      return;
    }
    await firstValueFrom(
      this.http.post('/api/plugins/ui-catalog', parsed, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
      })
    );
    this.uiPreviewResult.set(null);
    this.uiManifestJson.set('');
    await this.loadUiCatalog();
  }

  async removeFromCatalog(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`/api/plugins/ui-catalog/${encodeURIComponent(id)}`, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
      })
    );
    await this.loadUiCatalog();
  }

  refreshCanary(): void {
    void this.loadCanaryMetrics();
  }

  /**
   * Builds the `points` for a failure-ratio sparkline polyline in a 100x24 viewBox.
   * The domain is fixed to [0, 1] (0% at the bottom, 100% at the top) so the line is a
   * faithful, comparable view of the ratio, oldest sample on the left.
   */
  sparkline(trend: readonly number[]): string {
    const width = 100;
    const height = 24;
    const pad = 2;
    const n = trend.length;
    if (n === 0) {
      return '';
    }
    return trend
      .map((raw, i) => {
        const value = Math.min(1, Math.max(0, raw));
        const x = n === 1 ? width / 2 : pad + (i * (width - 2 * pad)) / (n - 1);
        const y = height - pad - value * (height - 2 * pad);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  private async loadCanaryMetrics(): Promise<void> {
    this.canaryLoading.set(true);
    this.canaryError.set(false);
    try {
      this.canaryMetrics.set(
        await firstValueFrom(
          this.http.get<readonly BackendCanaryMetric[]>('/api/plugins/canary/metrics', {
            context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
          })
        )
      );
    } catch {
      this.canaryError.set(true);
    } finally {
      this.canaryLoading.set(false);
    }
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

  readonly marketplaceCatalogUrl = signal('');
  readonly marketplacePluginId = signal('');
  readonly marketplacePreview = signal<BackendPluginDescriptor | null>(null);
  readonly marketplaceError = signal(false);

  async previewMarketplace(): Promise<void> {
    const catalogUrl = this.marketplaceCatalogUrl().trim();
    const pluginId = this.marketplacePluginId().trim();
    if (!catalogUrl || !pluginId) {
      return;
    }
    this.marketplaceError.set(false);
    this.marketplacePreview.set(null);
    try {
      const preview = await firstValueFrom(
        this.http.post<BackendPluginDescriptor>(
          '/api/plugins/marketplace/preview',
          { catalogUrl, pluginId },
          { context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true) }
        )
      );
      this.marketplacePreview.set(preview);
    } catch {
      this.marketplaceError.set(true);
    }
  }

  readonly uiManifestJson = signal('');
  readonly uiPreviewResult = signal<{ id: string; accepted: boolean; reason: string } | null>(null);
  readonly uiInvalidJson = signal(false);

  previewUiManifest(): void {
    const raw = this.uiManifestJson().trim();
    if (!raw) {
      return;
    }
    this.uiInvalidJson.set(false);
    this.uiPreviewResult.set(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.uiInvalidJson.set(true);
      return;
    }
    this.uiPreviewResult.set(this.registry.previewExternalManifest(parsed as never));
  }

  installMarketplace(): void {
    const preview = this.marketplacePreview();
    if (!preview) {
      return;
    }
    const catalogUrl = this.marketplaceCatalogUrl().trim();
    const pluginId = this.marketplacePluginId().trim();
    this.marketplacePreview.set(null);
    void this.runAction(() =>
      this.http.post('/api/plugins/marketplace/install', { catalogUrl, pluginId, active: true })
    );
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

  activateVersion(id: string, version: string): void {
    void this.runAction(() =>
      this.http.post(
        `/api/plugins/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}/activate`,
        {}
      )
    );
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
