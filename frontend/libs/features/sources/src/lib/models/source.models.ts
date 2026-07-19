import { SourceDraft, SourceProviderType } from '@integration-hub/core/providers';

export type SourceDirection = 'INPUT' | 'OUTPUT' | 'BOTH';

export interface SourceRecord {
  id: number;
  name: string;
  sourceType: SourceProviderType;
  active: boolean;
  configurationJson: string;
  // ADR-016: INPUT (lectura) / OUTPUT (sink de FILE_DELIVER) / BOTH.
  direction?: SourceDirection;
}

export interface SourceFormModel {
  id: number | null;
  name: string;
  sourceType: SourceProviderType;
  active: boolean;
  configurationJson: string;
  direction: SourceDirection;
}

export interface SourceTestResult {
  success: boolean;
  message: string;
  // 003: codigo estable del backend para mostrar un mensaje localizado en "Probar fuente".
  code?: string;
}

export function toSourceFormModel(source: SourceRecord): SourceFormModel {
  return {
    id: source.id,
    name: source.name,
    sourceType: source.sourceType,
    active: source.active,
    configurationJson: source.configurationJson,
    direction: source.direction ?? 'INPUT',
  };
}

export function createSourceForm(sourceType: SourceProviderType): SourceFormModel {
  return {
    id: null,
    name: '',
    sourceType,
    active: true,
    configurationJson: '{}',
    direction: 'INPUT',
  };
}

export type EditableSourceDraft = SourceDraft;
