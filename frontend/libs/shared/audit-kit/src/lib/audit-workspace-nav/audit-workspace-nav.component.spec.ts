import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthAccessService, I18nService } from '@integration-hub/core/services';
import { provideAppPluginManifests } from '@integration-hub/shared/ui';

import { AuditWorkspaceNavComponent } from './audit-workspace-nav.component';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('AuditWorkspaceNavComponent', () => {
  async function renderAt(url: string) {
    TestBed.configureTestingModule({
      imports: [AuditWorkspaceNavComponent],
      providers: [
        provideRouter([
          { path: 'audit/events', component: DummyComponent },
          { path: 'audit/record-lineage', component: DummyComponent },
          { path: 'audit/spool', component: DummyComponent },
          { path: 'swift-mt101/fragments', component: DummyComponent },
          { path: 'swift-mt101/quarantine', component: DummyComponent },
        ]),
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: AuthAccessService, useValue: { hasCapability: () => true } },
        ...provideAppPluginManifests([
          {
            id: 'platform',
            version: '1.0.0',
            platformVersion: '1.0.0',
            displayName: 'Platform',
            workspaces: [
              { id: 'audit-events', group: 'audit', domain: 'platform', domainLabelKey: 'audit.domain.platform', domainOrder: 10, route: '/audit/events', labelKey: 'audit.workspace.events', mode: 'query', requiredCapability: 'audit' },
              { id: 'audit-lineage', group: 'audit', domain: 'platform', domainLabelKey: 'audit.domain.platform', domainOrder: 10, route: '/audit/record-lineage', labelKey: 'audit.workspace.lineage', mode: 'query', requiredCapability: 'audit' },
              { id: 'audit-spool', group: 'audit', domain: 'platform', domainLabelKey: 'audit.domain.platform', domainOrder: 10, route: '/audit/spool', labelKey: 'audit.workspace.spool', mode: 'operation', requiredCapability: 'audit' },
              { id: 'mt101-fragments', group: 'audit', domain: 'swift-mt101', domainLabelKey: 'audit.domain.swiftMt101', domainOrder: 20, route: '/swift-mt101/fragments', labelKey: 'audit.workspace.fragments', mode: 'query', requiredCapability: 'audit' },
              { id: 'mt101-quarantine', group: 'audit', domain: 'swift-mt101', domainLabelKey: 'audit.domain.swiftMt101', domainOrder: 20, route: '/swift-mt101/quarantine', labelKey: 'audit.workspace.quarantine', mode: 'operation', requiredCapability: 'audit' },
            ],
          },
        ]),
      ],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(AuditWorkspaceNavComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('scopes al pack SWIFT MT101 cuando la ruta es /swift-mt101/*', async () => {
    const group = (await renderAt('/swift-mt101/fragments')).componentInstance.activeGroup();
    expect(group?.domain).toBe('swift-mt101');
    expect(group?.items.map((item) => item.route)).toEqual([
      '/swift-mt101/fragments',
      '/swift-mt101/quarantine',
    ]);
  });

  it('scopes al pack Generico cuando la ruta es /audit/*', async () => {
    const group = (await renderAt('/audit/record-lineage')).componentInstance.activeGroup();
    expect(group?.domain).toBe('platform');
    expect(group?.items.length).toBe(3);
  });

  it('renderiza solo las tools del pack activo', async () => {
    const nav: HTMLElement = (await renderAt('/swift-mt101/fragments')).nativeElement.querySelector('nav.audit-ws');
    expect(nav.querySelectorAll('a.audit-ws__item').length).toBe(2);
  });
});
