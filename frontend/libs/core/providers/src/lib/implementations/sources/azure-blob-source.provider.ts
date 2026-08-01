// @trace spec 001-catalogo-fuentes RF-006, RF-007 (catalogo-fuentes: fuente cloud Azure Blob Storage) ADR-006
import { Injectable } from '@angular/core';
import { SourceDraft, SourceProvider } from '../../sources/source-provider.abstract';

@Injectable()
export class AzureBlobSourceProvider extends SourceProvider {
  override readonly descriptor = {
    type: 'AZURE_BLOB',
    label: 'Azure Blob Storage',
    description:
      'Descarga archivos desde un contenedor de Azure Blob Storage seleccionando prefijo y regla de nombre.',
    category: 'Cloud',
    capabilities: ['Contenedor + prefijo', 'account-key / SAS / connection-string', 'Descarga por streaming'],
    supportsConnectionSecret: true,
  } as const;

  override createDraft(): SourceDraft {
    return {
      ...super.createDraft(),
      connectionKind: 'azure-blob',
      accountName: '',
      container: '',
      prefix: '',
      fileNameTemplate: '',
      selectionMode: 'latestModified',
      fileErrorPolicy: 'failFast',
      authMode: 'account-key',
      accountKey: '',
      sasToken: '',
      connectionString: '',
      endpoint: '',
      mediaType: '',
      templateVariablesText: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    const defaults = this.createDraft();
    return {
      ...defaults,
      accountName: String(configuration['accountName'] ?? ''),
      container: String(configuration['container'] ?? ''),
      prefix: String(configuration['prefix'] ?? ''),
      fileNameTemplate: String(configuration['fileNameTemplate'] ?? ''),
      selectionMode: (configuration['selectionMode'] as SourceDraft['selectionMode']) ?? defaults.selectionMode,
      fileErrorPolicy: (configuration['fileErrorPolicy'] as SourceDraft['fileErrorPolicy']) ?? defaults.fileErrorPolicy,
      authMode: (configuration['authMode'] as SourceDraft['authMode']) ?? 'account-key',
      accountKey: String(configuration['accountKey'] ?? ''),
      sasToken: String(configuration['sasToken'] ?? ''),
      connectionString: String(configuration['connectionString'] ?? ''),
      endpoint: String(configuration['endpoint'] ?? ''),
      mediaType: String(configuration['mediaType'] ?? ''),
      templateVariablesText: this.stringifyTemplateVariables(configuration['templateVariables']),
    };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    const authMode = draft.authMode || 'account-key';
    const templateVariables = this.parseTemplateVariables(draft.templateVariablesText);
    return {
      ...(draft.accountName ? { accountName: draft.accountName } : {}),
      container: draft.container || '',
      ...(draft.prefix ? { prefix: draft.prefix } : {}),
      ...(draft.fileNameTemplate ? { fileNameTemplate: draft.fileNameTemplate } : {}),
      ...(draft.selectionMode ? { selectionMode: draft.selectionMode } : {}),
      ...(draft.fileErrorPolicy ? { fileErrorPolicy: draft.fileErrorPolicy } : {}),
      authMode,
      ...(authMode === 'account-key' && draft.accountKey ? { accountKey: draft.accountKey } : {}),
      ...(authMode === 'sas-token' && draft.sasToken ? { sasToken: draft.sasToken } : {}),
      ...(authMode === 'connection-string' && draft.connectionString ? { connectionString: draft.connectionString } : {}),
      ...(draft.endpoint ? { endpoint: draft.endpoint } : {}),
      ...(draft.mediaType ? { mediaType: draft.mediaType } : {}),
      ...(Object.keys(templateVariables).length ? { templateVariables } : {}),
    };
  }
}
