import { ConnectionDraft, ConnectionProviderType } from '@integration-hub/core/providers';

export interface ConnectionRecord {
  id: number;
  name: string;
  connectionType: ConnectionProviderType;
  active: boolean;
  configurationJson: string;
}

export interface ConnectionFormModel {
  id: number | null;
  name: string;
  connectionType: ConnectionProviderType;
  active: boolean;
  configurationJson: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export function toConnectionFormModel(connection: ConnectionRecord): ConnectionFormModel {
  return {
    id: connection.id,
    name: connection.name,
    connectionType: connection.connectionType,
    active: connection.active,
    configurationJson: connection.configurationJson,
  };
}

export function createConnectionForm(connectionType: ConnectionProviderType): ConnectionFormModel {
  return {
    id: null,
    name: '',
    connectionType,
    active: true,
    configurationJson: '{}',
  };
}

export type EditableConnectionDraft = ConnectionDraft;
