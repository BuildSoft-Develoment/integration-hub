import {
  createActivateSelectedConnectionsHandler,
  createDeactivateSelectedConnectionsHandler,
} from './connection-bulk-action.handlers';
import { ConnectionRecord } from '../models/connection.models';

describe('connection bulk action handlers', () => {
  it('activates only when at least one selected connection is inactive', async () => {
    const setSelectedActive = vi.fn().mockResolvedValue(undefined);
    const handler = createActivateSelectedConnectionsHandler({
      selectedConnections: () => [
        connection({ id: 1, active: true }),
        connection({ id: 2, active: false }),
      ],
      setSelectedActive,
    });

    expect(handler.canExecute?.(action(), {})).toBe(true);
    await handler.execute(action(), {});

    expect(setSelectedActive).toHaveBeenCalledWith(true);
  });

  it('deactivates only when at least one selected connection is active', async () => {
    const setSelectedActive = vi.fn().mockResolvedValue(undefined);
    const handler = createDeactivateSelectedConnectionsHandler({
      selectedConnections: () => [
        connection({ id: 1, active: false }),
        connection({ id: 2, active: true }),
      ],
      setSelectedActive,
    });

    expect(handler.canExecute?.(action(), {})).toBe(true);
    await handler.execute(action(), {});

    expect(setSelectedActive).toHaveBeenCalledWith(false);
  });

  it('keeps unavailable actions hidden when selection already matches state', () => {
    const activate = createActivateSelectedConnectionsHandler({
      selectedConnections: () => [connection({ id: 1, active: true })],
      setSelectedActive: vi.fn(),
    });
    const deactivate = createDeactivateSelectedConnectionsHandler({
      selectedConnections: () => [connection({ id: 2, active: false })],
      setSelectedActive: vi.fn(),
    });

    expect(activate.canExecute?.(action(), {})).toBe(false);
    expect(deactivate.canExecute?.(action(), {})).toBe(false);
  });
});

function action() {
  return {
    id: 'bulk',
    labelKey: 'connections.bulk',
    command: 'connections.bulk',
  };
}

function connection(overrides: Pick<ConnectionRecord, 'id' | 'active'>): ConnectionRecord {
  return {
    id: overrides.id,
    name: `Connection ${overrides.id}`,
    connectionType: 'POSTGRESQL',
    active: overrides.active,
    configurationJson: '{}',
  };
}
