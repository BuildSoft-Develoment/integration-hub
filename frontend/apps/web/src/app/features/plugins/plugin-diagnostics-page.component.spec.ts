import { TestBed } from '@angular/core/testing';
import {
  AppPluginManifest,
  AppPluginRuntimeRegistry,
  provideAppPluginManifests,
} from '@integration-hub/shared/ui';

import { PluginDiagnosticsPageComponent } from './plugin-diagnostics-page.component';

describe('PluginDiagnosticsPageComponent', () => {
  it('renders installed plugins and quarantined plugins with their reasons', () => {
    TestBed.configureTestingModule({
      providers: [...provideAppPluginManifests([platformManifest()])],
    });

    const registry = TestBed.inject(AppPluginRuntimeRegistry);
    registry.installExternalManifests([
      { id: 'good', version: '1.0.0', platformVersion: '1.0.0', displayName: 'Good Plugin' },
      { id: 'future', version: '1.0.0', platformVersion: '2.0.0', displayName: 'Future Plugin' },
    ]);

    const fixture = TestBed.createComponent(PluginDiagnosticsPageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('platform');
    expect(text).toContain('Good Plugin');
    // Quarantined plugin id surfaces even though the manifest was rejected.
    expect(text).toContain('future');
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
