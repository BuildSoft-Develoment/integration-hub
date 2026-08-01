// @trace spec 001-catalogo-fuentes RF-006, RF-007 (catalogo-fuentes: fuente cloud Google Cloud Storage) ADR-006
import { Injectable } from '@angular/core';
import { SourceDraft, SourceProvider } from '../../sources/source-provider.abstract';

@Injectable()
export class GcsSourceProvider extends SourceProvider {
  override readonly descriptor = {
    type: 'GCS',
    label: 'Google Cloud Storage',
    description:
      'Descarga archivos desde un bucket de Google Cloud Storage seleccionando prefijo y regla de nombre.',
    category: 'Cloud',
    capabilities: ['Bucket + prefijo', 'ADC/Workload Identity o service account JSON', 'Descarga por streaming'],
    supportsConnectionSecret: true,
  } as const;

  override createDraft(): SourceDraft {
    return {
      ...super.createDraft(),
      connectionKind: 'gcs',
      bucket: '',
      prefix: '',
      fileNameTemplate: '',
      selectionMode: 'latestModified',
      fileErrorPolicy: 'failFast',
      authMode: 'adc',
      projectId: '',
      serviceAccountJson: '',
      mediaType: '',
      templateVariablesText: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    const defaults = this.createDraft();
    return {
      ...defaults,
      bucket: String(configuration['bucket'] ?? ''),
      prefix: String(configuration['prefix'] ?? ''),
      fileNameTemplate: String(configuration['fileNameTemplate'] ?? ''),
      selectionMode: (configuration['selectionMode'] as SourceDraft['selectionMode']) ?? defaults.selectionMode,
      fileErrorPolicy: (configuration['fileErrorPolicy'] as SourceDraft['fileErrorPolicy']) ?? defaults.fileErrorPolicy,
      authMode: (configuration['authMode'] as SourceDraft['authMode']) ?? 'adc',
      projectId: String(configuration['projectId'] ?? ''),
      serviceAccountJson: String(configuration['serviceAccountJson'] ?? ''),
      mediaType: String(configuration['mediaType'] ?? ''),
      templateVariablesText: this.stringifyTemplateVariables(configuration['templateVariables']),
    };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    const authMode = draft.authMode || 'adc';
    const templateVariables = this.parseTemplateVariables(draft.templateVariablesText);
    return {
      bucket: draft.bucket || '',
      ...(draft.prefix ? { prefix: draft.prefix } : {}),
      ...(draft.fileNameTemplate ? { fileNameTemplate: draft.fileNameTemplate } : {}),
      ...(draft.selectionMode ? { selectionMode: draft.selectionMode } : {}),
      ...(draft.fileErrorPolicy ? { fileErrorPolicy: draft.fileErrorPolicy } : {}),
      authMode,
      ...(draft.projectId ? { projectId: draft.projectId } : {}),
      ...(authMode === 'service-account-json' && draft.serviceAccountJson ? { serviceAccountJson: draft.serviceAccountJson } : {}),
      ...(draft.mediaType ? { mediaType: draft.mediaType } : {}),
      ...(Object.keys(templateVariables).length ? { templateVariables } : {}),
    };
  }
}
