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
                domain: 'platform',
                domainLabelKey: 'audit.domain.platform',
                domainOrder: 10,
                route: '/audit',
                labelKey: 'audit.workspace.events',
                descriptionKey: 'audit.workspace.eventsHint',
                mode: 'query',
                requiredCapability: 'audit',
              },
              {
                id: 'audit-record-lineage',
                group: 'audit',
                domain: 'platform',
                domainLabelKey: 'audit.domain.platform',
                domainOrder: 10,
                route: '/audit/record-lineage',
                labelKey: 'audit.workspace.lineage',
                descriptionKey: 'audit.workspace.lineageHint',
                mode: 'query',
                requiredCapability: 'audit',
              },
              {
                id: 'audit-mt101-fragments',
                group: 'audit',
                domain: 'swift-mt101',
                domainLabelKey: 'audit.domain.swiftMt101',
                domainOrder: 20,
                route: '/audit/mt101-fragments',
                labelKey: 'audit.workspace.fragments',
                descriptionKey: 'audit.workspace.fragmentsHint',
                mode: 'query',
                requiredCapability: 'audit',
              },
              {
                id: 'audit-spool',
                group: 'audit',
                domain: 'platform',
                domainLabelKey: 'audit.domain.platform',
                domainOrder: 10,
                route: '/audit/spool',
                labelKey: 'audit.workspace.spool',
                descriptionKey: 'audit.workspace.spoolHint',
                mode: 'operation',
                requiredCapability: 'audit',
              },
              {
                id: 'audit-mt101-quarantine',
                group: 'audit',
                domain: 'swift-mt101',
                domainLabelKey: 'audit.domain.swiftMt101',
                domainOrder: 20,
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

  it('agrupa las superficies del workspace audit por dominio (ADR-019)', () => {
    const component = render().componentInstance;
    const groups = component.groups();

    // Dos dominios, ordenados por domainOrder: platform (10) antes que swift-mt101 (20).
    expect(groups.map((g) => g.domain)).toEqual(['platform', 'swift-mt101']);
    // El generico agrupa events/lineage/spool aunque spool se declare despues de un item SWIFT.
    expect(groups[0].items.map((item) => item.route)).toEqual([
      '/audit',
      '/audit/record-lineage',
      '/audit/spool',
    ]);
    expect(groups[1].items.map((item) => item.route)).toEqual([
      '/audit/mt101-fragments',
      '/audit/mt101-quarantine',
    ]);
    expect(groups[1].labelKey).toBe('audit.domain.swiftMt101');
  });

  it('separa consulta de operacion gobernada (modo como tag secundario)', () => {
    const component = render().componentInstance;
    const operationRoutes = component
      .groups()
      .flatMap((g) => g.items)
      .filter((item) => item.mode === 'operation')
      .map((item) => item.route);

    expect(operationRoutes).toEqual(['/audit/spool', '/audit/mt101-quarantine']);
    expect(component.modeLabelKey('operation')).toBe('audit.workspace.modeOperation');
    expect(component.modeLabelKey('query')).toBe('audit.workspace.modeQuery');
  });

  it('renderiza navegacion con nombre accesible, 2 grupos y 5 cajas', () => {
    const nav: HTMLElement = render().nativeElement.querySelector('nav.audit-ws');

    expect(nav).toBeTruthy();
    expect(nav.getAttribute('aria-label')).toBe('audit.workspace.label');
    expect(nav.querySelectorAll('.audit-ws__group').length).toBe(2);
    expect(nav.querySelectorAll('.audit-ws__group-label').length).toBe(2);
    expect(nav.querySelectorAll('a.audit-ws__item').length).toBe(5);
  });
});
