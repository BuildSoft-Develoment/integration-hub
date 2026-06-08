import { describe, expect, it } from 'vitest';
import { ProcessTaskFormBridgeService } from './process-task-form-bridge.service';

describe('ProcessTaskFormBridgeService (M-1b output bridge)', () => {
  it('emits with auto-incrementing id', () => {
    const bridge = new ProcessTaskFormBridgeService();
    expect(bridge.lastPatch()).toBeNull();

    bridge.emit({ active: true });
    const first = bridge.lastPatch();
    expect(first).not.toBeNull();
    expect(first!.id).toBe(1);
    expect(first!.patch).toEqual({ active: true });

    bridge.emit({ active: false });
    const second = bridge.lastPatch();
    expect(second!.id).toBe(2);
    expect(second!.patch).toEqual({ active: false });
  });

  it('distinguishes consecutive emissions with the same payload via id', () => {
    const bridge = new ProcessTaskFormBridgeService();
    bridge.emit({ taskOrder: 1 });
    const first = bridge.lastPatch();
    bridge.emit({ taskOrder: 1 });
    const second = bridge.lastPatch();

    expect(first!.patch).toEqual(second!.patch);
    expect(first!.id).not.toBe(second!.id);
  });

  it('preserves arbitrary patch shape', () => {
    const bridge = new ProcessTaskFormBridgeService();
    bridge.emit({ configurationJson: '{"format":"JSON"}' });
    expect(bridge.lastPatch()!.patch).toEqual({ configurationJson: '{"format":"JSON"}' });
  });
});
