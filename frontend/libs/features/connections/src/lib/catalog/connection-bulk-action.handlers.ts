import { Provider } from '@angular/core';
import {
  APP_ACTION_COMMAND_HANDLERS,
  AppActionCommandHandler,
} from '@integration-hub/shared/ui';

import { ConnectionCatalogStore } from './connection-catalog.store';
import { ConnectionRecord } from '../models/connection.models';

export const CONNECTION_BULK_ACTIVATE_COMMAND = 'connections.bulk.activate';
export const CONNECTION_BULK_DEACTIVATE_COMMAND = 'connections.bulk.deactivate';

export interface ConnectionBulkActionStore {
  selectedConnections(): readonly Pick<ConnectionRecord, 'active'>[];
  setSelectedActive(active: boolean): Promise<void>;
}

export function provideConnectionBulkActionHandlers(): Provider[] {
  return [
    {
      provide: APP_ACTION_COMMAND_HANDLERS,
      multi: true,
      deps: [ConnectionCatalogStore],
      useFactory: (store: ConnectionCatalogStore) =>
        createActivateSelectedConnectionsHandler(store),
    },
    {
      provide: APP_ACTION_COMMAND_HANDLERS,
      multi: true,
      deps: [ConnectionCatalogStore],
      useFactory: (store: ConnectionCatalogStore) =>
        createDeactivateSelectedConnectionsHandler(store),
    },
  ];
}

export function createActivateSelectedConnectionsHandler(
  store: ConnectionBulkActionStore
): AppActionCommandHandler {
  return {
    command: CONNECTION_BULK_ACTIVATE_COMMAND,
    source: 'connections',
    canExecute: () => store.selectedConnections().some((connection) => !connection.active),
    execute: () => store.setSelectedActive(true),
  };
}

export function createDeactivateSelectedConnectionsHandler(
  store: ConnectionBulkActionStore
): AppActionCommandHandler {
  return {
    command: CONNECTION_BULK_DEACTIVATE_COMMAND,
    source: 'connections',
    canExecute: () => store.selectedConnections().some((connection) => connection.active),
    execute: () => store.setSelectedActive(false),
  };
}
