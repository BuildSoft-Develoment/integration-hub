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
});

function platformManifest(): AppPluginManifest {
  return {
    id: 'platform',
    version: '1.0.0',
    platformVersion: '1.0.0',
    displayName: 'Platform',
  };
}
