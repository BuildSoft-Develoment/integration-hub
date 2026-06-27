import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthAccessService, I18nService } from '@integration-hub/core/services';
import { provideAppPluginManifests } from '@integration-hub/shared/ui';

import { AuditWorkspaceNavComponent } from './audit-workspace-nav.component';

describe('AuditWorkspaceNavComponent', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [AuditWorkspaceNavComponent],
      providers: [
        provideRouter([]),
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: AuthAccessService, useValue: { hasCapability: () => true } },
        ...provideAppPluginManifests([
          {
            id: 'platform',
            version: '1.0.0',
            platformVersion: '1.0.0',
            displayName: 'Platform',
            workspaces: [
              {
                id: 'audit-events',
                group: 'audit',
                route: '/audit',
                labelKey: 'audit.workspace.events',
                descriptionKey: 'audit.workspace.eventsHint',
                mode: 'query',
                requiredCapability: 'audit',
              },
              {
                id: 'audit-record-lineage',
                group: 'audit',
                route: '/audit/record-lineage',
                labelKey: 'audit.workspace.lineage',
                descriptionKey: 'audit.workspace.lineageHint',
                mode: 'query',
                requiredCapability: 'audit',
              },
              {
                id: 'audit-mt101-fragments',
                group: 'audit',
                route: '/audit/mt101-fragments',
                labelKey: 'audit.workspace.fragments',
                descriptionKey: 'audit.workspace.fragmentsHint',
                mode: 'query',
                requiredCapability: 'audit',
              },
              {
                id: 'audit-spool',
                group: 'audit',
                route: '/audit/spool',
                labelKey: 'audit.workspace.spool',
                descriptionKey: 'audit.workspace.spoolHint',
                mode: 'operation',
                requiredCapability: 'audit',
              },
              {
                id: 'audit-mt101-quarantine',
                group: 'audit',
                route: '/audit/mt101-quarantine',
                labelKey: 'audit.workspace.quarantine',
                descriptionKey: 'audit.workspace.quarantineHint',
                mode: 'operation',
                requiredCapability: 'audit',
              },
              {
                id: 'payments-rules',
                group: 'payments',
                route: '/payment-rules',
                labelKey: 'nav.paymentRules',
                mode: 'configuration',
                requiredCapability: 'operate',
              },
            ],
          },
        ]),
      ],
    });
    const fixture = TestBed.createComponent(AuditWorkspaceNavComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('declara las cinco superficies del workspace audit', () => {
    const component = render().componentInstance;

    expect(component.items().map((item) => item.route)).toEqual([
      '/audit',
      '/audit/record-lineage',
      '/audit/mt101-fragments',
      '/audit/spool',
      '/audit/mt101-quarantine',
    ]);
  });

  it('separa consulta de operacion gobernada', () => {
    const component = render().componentInstance;
    const operationRoutes = component.items()
      .filter((item) => item.mode === 'operation')
      .map((item) => item.route);

    expect(operationRoutes).toEqual(['/audit/spool', '/audit/mt101-quarantine']);
    expect(component.modeLabelKey('operation')).toBe('audit.workspace.modeOperation');
    expect(component.modeLabelKey('query')).toBe('audit.workspace.modeQuery');
  });

  it('renderiza navegacion con nombre accesible', () => {
    const nav: HTMLElement = render().nativeElement.querySelector('nav.audit-ws');

    expect(nav).toBeTruthy();
    expect(nav.getAttribute('aria-label')).toBe('audit.workspace.label');
    expect(nav.querySelectorAll('a.audit-ws__item').length).toBe(5);
  });
});
