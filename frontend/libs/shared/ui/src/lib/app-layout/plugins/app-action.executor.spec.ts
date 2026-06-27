import { DOCUMENT } from '@angular/common';
import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AppActionExecutor } from './app-action.executor';
import { provideAppActionCommandHandlers } from './app-action.command';
import {
  AppActionConfirmationRequest,
  provideAppActionConfirmationGate,
} from './app-action.confirmation';

describe('AppActionExecutor', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('executes command actions through registered static handlers', async () => {
    const calls: string[] = [];
    const executor = configure([
      ...provideAppActionCommandHandlers(
        [
          {
            command: 'audit.refresh',
            execute: (action, context) => {
              calls.push(`${action.id}:${context.source}`);
            },
          },
        ],
        'audit-plugin'
      ),
    ]);

    await executor.execute(
      {
        id: 'audit-refresh',
        labelKey: 'audit.refresh',
        command: 'audit.refresh',
      },
      { source: 'toolbar' }
    );

    expect(calls).toEqual(['audit-refresh:toolbar']);
  });

  it('rejects command actions without installed handlers', async () => {
    const executor = configure();

    await expect(
      executor.execute({
        id: 'missing-handler',
        labelKey: 'action.missing',
        command: 'missing.run',
      })
    ).rejects.toThrow(/No handler registered/);
  });

  it('rejects duplicate command handlers', async () => {
    const executor = configure([
      ...provideAppActionCommandHandlers([{ command: 'sync.run', execute: () => undefined }], 'a'),
      ...provideAppActionCommandHandlers([{ command: 'sync.run', execute: () => undefined }], 'b'),
    ]);

    await expect(
      executor.execute({
        id: 'sync',
        labelKey: 'action.sync',
        command: 'sync.run',
      })
    ).rejects.toThrow(/Duplicate handlers registered/);
  });

  it('uses canExecute before dispatching a command', async () => {
    const executor = configure([
      ...provideAppActionCommandHandlers([
        {
          command: 'restricted.run',
          canExecute: () => false,
          execute: () => undefined,
        },
      ]),
    ]);
    const action = {
      id: 'restricted',
      labelKey: 'action.restricted',
      command: 'restricted.run',
    };

    expect(executor.canExecute(action)).toBe(false);
    await expect(executor.execute(action)).rejects.toThrow(/cannot be executed/);
  });

  it('navigates action routes through Angular router', async () => {
    const executor = configure();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await expect(
      executor.execute({
        id: 'open-audit',
        labelKey: 'action.openAudit',
        route: '/audit',
      })
    ).resolves.toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith('/audit');
  });

  it('opens only https external links', async () => {
    const openSpy = vi.fn();
    const executor = configure([
      {
        provide: DOCUMENT,
        useValue: {
          defaultView: { open: openSpy },
        },
      },
    ]);

    await executor.execute({
      id: 'open-docs',
      labelKey: 'action.docs',
      href: 'https://example.com/docs',
    });

    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/docs',
      '_blank',
      'noopener,noreferrer'
    );

    await expect(
      executor.execute({
        id: 'unsafe-docs',
        labelKey: 'action.docs',
        href: 'http://example.com/docs',
      })
    ).rejects.toThrow(/external href must start/);
  });

  it('runs commands without confirmation when none is declared', async () => {
    const calls: string[] = [];
    const executor = configure([
      ...provideAppActionCommandHandlers([
        { command: 'plain.run', execute: () => void calls.push('run') },
      ]),
    ]);

    await expect(
      executor.execute({ id: 'plain', labelKey: 'action.plain', command: 'plain.run' })
    ).resolves.toBe(true);
    expect(calls).toEqual(['run']);
  });

  it('executes a confirmed action and forwards severity to the gate', async () => {
    const calls: string[] = [];
    const seen: AppActionConfirmationRequest[] = [];
    const executor = configure([
      provideAppActionConfirmationGate({
        confirm: (request) => {
          seen.push(request);
          return true;
        },
      }),
      ...provideAppActionCommandHandlers([
        { command: 'danger.run', execute: () => void calls.push('run') },
      ]),
    ]);

    await expect(
      executor.execute({
        id: 'danger',
        labelKey: 'action.danger',
        command: 'danger.run',
        confirmation: { labelKey: 'action.danger.confirm', severity: 'danger' },
      })
    ).resolves.toBe(true);
    expect(calls).toEqual(['run']);
    expect(seen).toEqual([
      { actionId: 'danger', severity: 'danger', labelKey: 'action.danger.confirm' },
    ]);
  });

  it('aborts a command action when confirmation is rejected', async () => {
    const calls: string[] = [];
    const executor = configure([
      provideAppActionConfirmationGate({ confirm: () => false }),
      ...provideAppActionCommandHandlers([
        { command: 'danger.run', execute: () => void calls.push('run') },
      ]),
    ]);

    await expect(
      executor.execute({
        id: 'danger',
        labelKey: 'action.danger',
        command: 'danger.run',
        confirmation: { severity: 'danger' },
      })
    ).resolves.toBe(false);
    expect(calls).toEqual([]);
  });

  it('does not navigate when confirmation is rejected', async () => {
    const executor = configure([
      provideAppActionConfirmationGate({ confirm: () => false }),
    ]);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await expect(
      executor.execute({
        id: 'open-audit',
        labelKey: 'action.openAudit',
        route: '/audit',
        confirmation: { severity: 'warning' },
      })
    ).resolves.toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not open external links when confirmation is rejected', async () => {
    const openSpy = vi.fn();
    const executor = configure([
      provideAppActionConfirmationGate({ confirm: () => false }),
      { provide: DOCUMENT, useValue: { defaultView: { open: openSpy } } },
    ]);

    await expect(
      executor.execute({
        id: 'open-docs',
        labelKey: 'action.docs',
        href: 'https://example.com/docs',
        confirmation: { severity: 'warning' },
      })
    ).resolves.toBe(false);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('fails safe: denies a confirmable action when no gate is registered', async () => {
    const calls: string[] = [];
    const executor = configure([
      ...provideAppActionCommandHandlers([
        { command: 'danger.run', execute: () => void calls.push('run') },
      ]),
    ]);

    await expect(
      executor.execute({
        id: 'danger',
        labelKey: 'action.danger',
        command: 'danger.run',
        confirmation: { severity: 'danger' },
      })
    ).resolves.toBe(false);
    expect(calls).toEqual([]);
  });
});

function configure(providers: Provider[] = []) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), ...providers],
  });

  return TestBed.inject(AppActionExecutor);
}
