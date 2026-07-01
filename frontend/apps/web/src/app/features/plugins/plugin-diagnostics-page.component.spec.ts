import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  AppPluginManifest,
  AppPluginRuntimeRegistry,
  provideAppPluginManifests,
} from '@integration-hub/shared/ui';

import { PluginDiagnosticsPageComponent } from './plugin-diagnostics-page.component';

describe('PluginDiagnosticsPageComponent', () => {
  it('renders installed plugins and quarantined plugins with their reasons', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const registry = TestBed.inject(AppPluginRuntimeRegistry);
    registry.installExternalManifests([
      { id: 'good', version: '1.0.0', platformVersion: '1.0.0', displayName: 'Good Plugin' },
      { id: 'future', version: '1.0.0', platformVersion: '2.0.0', displayName: 'Future Plugin' },
    ]);

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('platform');
    expect(text).toContain('Good Plugin');
    // Quarantined plugin id surfaces even though the manifest was rejected.
    expect(text).toContain('future');
    http.verify();
  });

  it('filters the unified registry view by status', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const registry = TestBed.inject(AppPluginRuntimeRegistry);
    registry.installExternalManifests([
      { id: 'good', version: '1.0.0', platformVersion: '1.0.0', displayName: 'Good Plugin' },
      { id: 'future', version: '1.0.0', platformVersion: '2.0.0', displayName: 'Future Plugin' },
    ]);

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();
    const component = fixture.componentInstance;

    // 'all' shows installed (platform + good) and quarantined (future).
    expect(component.filteredFrontendRows().length).toBe(component.frontendRows().length);
    expect(component.frontendRows().length).toBeGreaterThanOrEqual(3);

    component.frontendFilter.set('quarantined');
    const quarantined = component.filteredFrontendRows();
    expect(quarantined.every((row) => row.status === 'quarantined')).toBe(true);
    expect(quarantined.some((row) => row.id === 'future')).toBe(true);
    expect(quarantined.some((row) => row.id === 'good')).toBe(false);

    component.frontendFilter.set('installed');
    const installed = component.filteredFrontendRows();
    expect(installed.every((row) => row.status === 'installed')).toBe(true);
    expect(installed.some((row) => row.id === 'good')).toBe(true);
    http.verify();
  });

  it('exposes aria-busy on the view while an action is in progress', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector(
      '.plugin-diagnostics-page'
    ) as HTMLElement;
    expect(root.getAttribute('aria-busy')).toBe('false');

    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();
    expect(root.getAttribute('aria-busy')).toBe('true');
    http.verify();
  });

  it('renders backend plugin diagnostics', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({
      installed: [
        {
          id: 'acme',
          version: '1.0.0',
          spiVersion: '1',
          providedTypes: ['ACME_DO'],
          transport: 'GRPC',
          trusted: true,
          status: 'ACTIVE',
          degradedReason: null,
        },
      ],
      degraded: {},
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('acme');
    expect(text).toContain('ACME_DO');
    http.verify();
  });

  it('reloads backend plugins via the API and refetches diagnostics', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();

    fixture.componentInstance.reloadBackend();
    http.expectOne((req) => req.method === 'POST' && req.url === '/api/plugins/reload').flush({});
    await fixture.whenStable();

    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    http.verify();
  });

  it('deactivates a backend plugin via the API and refetches diagnostics', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();

    fixture.componentInstance.deactivate('acme');
    http.expectOne((req) => req.method === 'POST' && req.url === '/api/plugins/acme/deactivate').flush({});
    await fixture.whenStable();

    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    http.verify();
  });

  it('requires two-step confirmation before deactivating', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.requestDeactivate('acme');
    expect(component.confirmingDeactivate()).toBe('acme');

    component.confirmDeactivate('acme');
    expect(component.confirmingDeactivate()).toBeNull();
    http.expectOne((req) => req.method === 'POST' && req.url === '/api/plugins/acme/deactivate').flush({});
    await fixture.whenStable();
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    http.verify();
  });

  it('cancels a pending deactivation without calling the API', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.requestDeactivate('acme');
    component.cancelDeactivate();

    expect(component.confirmingDeactivate()).toBeNull();
    http.verify();
  });

  it('previews a marketplace plugin via the API', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.marketplaceCatalogUrl.set('https://market.example.com/catalog.json');
    component.marketplacePluginId.set('acme');
    const previewPromise = component.previewMarketplace();

    const req = http.expectOne(
      (r) => r.method === 'POST' && r.url === '/api/plugins/marketplace/preview'
    );
    expect(req.request.body).toEqual({
      catalogUrl: 'https://market.example.com/catalog.json',
      pluginId: 'acme',
    });
    req.flush({
      id: 'acme',
      version: '1.0.0',
      spiVersion: '1',
      providedTypes: ['ACME_DO'],
      transport: 'GRPC',
      trusted: true,
      status: 'ACTIVE',
      degradedReason: null,
    });
    await previewPromise;

    expect(component.marketplacePreview()?.id).toBe('acme');
    http.verify();
  });

  it('installs a previewed marketplace plugin and refetches diagnostics', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.marketplaceCatalogUrl.set('https://market.example.com/catalog.json');
    component.marketplacePluginId.set('acme');
    component.marketplacePreview.set({
      id: 'acme',
      version: '1.0.0',
      spiVersion: '1',
      providedTypes: [],
      transport: 'GRPC',
      trusted: true,
      status: 'ACTIVE',
      degradedReason: null,
    });

    component.installMarketplace();
    http
      .expectOne((r) => r.method === 'POST' && r.url === '/api/plugins/marketplace/install')
      .flush({ installed: [], versions: [], degraded: {} });
    await fixture.whenStable();
    http.expectOne('/api/plugins').flush({ installed: [], degraded: {} });

    expect(component.marketplacePreview()).toBeNull();
    http.verify();
  });

  it('activates a plugin version via the API and refetches diagnostics', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({ installed: [], versions: [], degraded: {} });
    await fixture.whenStable();

    fixture.componentInstance.activateVersion('acme', '2.0.0');
    http
      .expectOne((r) => r.method === 'POST' && r.url === '/api/plugins/acme/versions/2.0.0/activate')
      .flush({ installed: [], versions: [], degraded: {} });
    await fixture.whenStable();
    http.expectOne('/api/plugins').flush({ installed: [], versions: [], degraded: {} });
    http.verify();
  });

  it('renders backend plugin versions with an activate action for inactive ones', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideAppPluginManifests([platformManifest()]),
      ],
    });

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/plugins').flush({
      installed: [],
      versions: [
        { id: 'acme', version: '1.0.0', spiVersion: '1', transport: 'GRPC', trusted: true, active: true, channel: 'stable', pinned: false },
        { id: 'acme', version: '2.0.0', spiVersion: '1', transport: 'GRPC', trusted: true, active: false, channel: 'canary', pinned: false },
      ],
      degraded: {},
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('2.0.0');
    expect(text).toContain('canary');

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).map((b) => (b.textContent ?? '').trim());
    expect(labels.some((l) => /Activar version|Activate version/.test(l))).toBe(true);
    http.verify();
  });
});

function platformManifest(): AppPluginManifest {
  return {
    id: 'platform',
    version: '1.0.0',
    platformVersion: '1.0.0',
    displayName: 'Platform',
  };
}
