import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthAccessService } from '@integration-hub/core/services';

import { provideAppActionCommandHandlers } from './app-action.command';
import { AppActionQueryService } from './app-action.query';
import { provideAppPluginManifests } from './app-plugin.token';

describe('AppActionQueryService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('filters actions by placement, group, capability and executable command', () => {
    const query = configure({
      capabilities: ['operate'],
      handlers: [
        {
          command: 'connections.activate',
          execute: () => undefined,
        },
      ],
    });

    const actions = query.visibleActions({ placement: 'toolbar', group: 'connections' });

    expect(actions.map((action) => action.id)).toEqual([
      'connections-open',
      'connections-activate',
    ]);
  });

  it('can include disabled command actions for explanatory UI states', () => {
    const query = configure({ capabilities: ['operate'] });

    const actions = query.visibleActions(
      { placement: 'toolbar', group: 'connections', includeDisabled: true }
    );

    expect(actions.map((action) => action.id)).toContain('connections-activate');
  });

  it('maps visible actions to floating action bar contracts', () => {
    const query = configure({
      capabilities: ['operate'],
      handlers: [
        {
          command: 'connections.activate',
          execute: () => undefined,
        },
      ],
    });

    const actions = query.actionBarActions({ placement: 'toolbar', group: 'connections' });

    expect(actions).toEqual([
      {
        id: 'connections-open',
        labelKey: 'connections.open',
        icon: 'arrow-right',
        danger: false,
        requiresConfirmation: false,
        confirmationLabelKey: undefined,
      },
      {
        id: 'connections-activate',
        labelKey: 'connections.activate',
        icon: 'toggle-on',
        danger: false,
        requiresConfirmation: false,
        confirmationLabelKey: undefined,
      },
    ]);
  });

  it('marks dangerous confirmations for action bar consumers', () => {
    const query = configure({
      capabilities: ['operate'],
      handlers: [
        {
          command: 'connections.delete',
          execute: () => undefined,
        },
      ],
    });

    const actions = query.actionBarActions({ placement: 'record', group: 'connections' });

    expect(actions).toEqual([
      {
        id: 'connections-delete',
        labelKey: 'connections.delete',
        icon: 'trash',
        danger: true,
        requiresConfirmation: true,
        confirmationLabelKey: undefined,
      },
    ]);
  });
});

interface ConfigureOptions {
  readonly capabilities?: readonly string[];
  readonly handlers?: Parameters<typeof provideAppActionCommandHandlers>[0];
}

function configure(options: ConfigureOptions = {}): AppActionQueryService {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      ...provideAppPluginManifests([
        {
          id: 'connections',
          version: '1.0.0',
          platformVersion: '1.0.0',
          displayName: 'Connections',
          actions: [
            {
              id: 'connections-open',
              labelKey: 'connections.open',
              placement: 'toolbar',
              group: 'connections',
              route: '/connections',
              requiredCapability: 'operate',
            },
            {
              id: 'connections-activate',
              labelKey: 'connections.activate',
              placement: 'toolbar',
              group: 'connections',
              command: 'connections.activate',
              icon: 'toggle-on',
              requiredCapability: 'operate',
            },
            {
              id: 'connections-admin-only',
              labelKey: 'connections.adminOnly',
              placement: 'toolbar',
              group: 'connections',
              command: 'connections.admin',
              requiredCapability: 'admin',
            },
            {
              id: 'connections-delete',
              labelKey: 'connections.delete',
              placement: 'record',
              group: 'connections',
              command: 'connections.delete',
              icon: 'trash',
              requiredCapability: 'operate',
              confirmation: { severity: 'danger' },
            },
          ],
        },
      ]),
      ...provideAppActionCommandHandlers(options.handlers ?? [], 'test'),
      {
        provide: AuthAccessService,
        useValue: {
          hasCapability: (capability: string) => options.capabilities?.includes(capability) ?? false,
        },
      },
      {
        provide: DOCUMENT,
        useValue: {
          defaultView: { open: vi.fn() },
        },
      },
    ],
  });

  return TestBed.inject(AppActionQueryService);
}
