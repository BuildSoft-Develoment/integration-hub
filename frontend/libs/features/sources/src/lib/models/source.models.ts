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
  /** ADR-021 (E): entregar aqui MUEVE DINERO. Solo tiene sentido con direction de salida. */
  moneyCritical?: boolean;
}

export interface SourceFormModel {
  id: number | null;
  name: string;
  sourceType: SourceProviderType;
  active: boolean;
  configurationJson: string;
  direction: SourceDirection;
  moneyCritical: boolean;
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
    moneyCritical: source.moneyCritical ?? false,
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
    // Default seguro: una fuente nace sin marcar. Declarar que es un banco es una decision explicita.
    moneyCritical: false,
  };
}

export type EditableSourceDraft = SourceDraft;
