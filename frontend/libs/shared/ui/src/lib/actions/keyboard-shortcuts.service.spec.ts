import { TestBed } from '@angular/core/testing';

import { KeyboardShortcutsService } from './keyboard-shortcuts.service';

describe('KeyboardShortcutsService', () => {
  let service: KeyboardShortcutsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeyboardShortcutsService);
  });

  afterEach(() => {
    service.clear();
    TestBed.resetTestingModule();
  });

  it('ignores shortcuts while focus is inside editable controls', () => {
    const handler = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);

    service.register([{ key: 'c', description: 'create', handler }]);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true }));

    expect(handler).not.toHaveBeenCalled();

    input.remove();
  });

  it('unregisters only the shortcuts returned by a registration', () => {
    const create = vi.fn();
    const refresh = vi.fn();

    const unregisterCreate = service.register([{ key: 'c', description: 'create', handler: create }]);
    service.register([{ key: 'r', description: 'refresh', handler: refresh }]);

    unregisterCreate();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true }));

    expect(create).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('prevents default for matched shortcuts unless explicitly disabled', () => {
    service.register([{ key: '/', description: 'search', handler: vi.fn() }]);

    const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
