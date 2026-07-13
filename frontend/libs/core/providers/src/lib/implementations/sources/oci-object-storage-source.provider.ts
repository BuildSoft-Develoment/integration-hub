// @trace RF-006, RF-007 (catalogo-fuentes: fuente cloud OCI Object Storage, S3-compatible) ADR-006
import { Injectable } from '@angular/core';
import { SourceDraft, SourceProvider } from '../../sources/source-provider.abstract';

/**
 * Fuente OCI Object Storage (Oracle Cloud). El backend la resuelve como fachada sobre el
 * provider S3 (API S3-compatible de OCI), asi que la config amigable namespace/region/bucket
 * se traduce alla; aqui el frontend solo expone el formulario. Auth por Customer Secret Keys
 * (access-key). {@code endpoint} opcional para override explicito (tests/emulador).
 */
@Injectable()
export class OciObjectStorageSourceProvider extends SourceProvider {
  override readonly descriptor = {
    type: 'OCI_OBJECT_STORAGE',
    label: 'Oracle Cloud (OCI) Object Storage',
    description:
      'Descarga archivos desde un bucket de OCI Object Storage (API S3-compatible) por namespace, region y prefijo.',
    category: 'Cloud',
    capabilities: ['Namespace + bucket + prefijo', 'Customer Secret Keys', 'Descarga por streaming'],
    supportsConnectionSecret: true,
  } as const;

  override createDraft(): SourceDraft {
    return {
      ...super.createDraft(),
      connectionKind: 'oci-object-storage',
      namespace: '',
      region: '',
      bucket: '',
      prefix: '',
      fileNameTemplate: '',
      selectionMode: 'latestModified',
      fileErrorPolicy: 'failFast',
      authMode: 'access-key',
      accessKeyId: '',
      secretAccessKey: '',
      endpoint: '',
      mediaType: '',
      templateVariablesText: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    const defaults = this.createDraft();
    return {
      ...defaults,
      namespace: String(configuration['namespace'] ?? ''),
      region: String(configuration['region'] ?? ''),
      bucket: String(configuration['bucket'] ?? ''),
      prefix: String(configuration['prefix'] ?? ''),
      fileNameTemplate: String(configuration['fileNameTemplate'] ?? ''),
      selectionMode: (configuration['selectionMode'] as SourceDraft['selectionMode']) ?? defaults.selectionMode,
      fileErrorPolicy: (configuration['fileErrorPolicy'] as SourceDraft['fileErrorPolicy']) ?? defaults.fileErrorPolicy,
      authMode: (configuration['authMode'] as SourceDraft['authMode']) ?? 'access-key',
      accessKeyId: String(configuration['accessKeyId'] ?? ''),
      secretAccessKey: String(configuration['secretAccessKey'] ?? ''),
      endpoint: String(configuration['endpoint'] ?? ''),
      mediaType: String(configuration['mediaType'] ?? ''),
      templateVariablesText: this.stringifyTemplateVariables(configuration['templateVariables']),
    };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    const templateVariables = this.parseTemplateVariables(draft.templateVariablesText);
    return {
      namespace: draft.namespace || '',
      region: draft.region || '',
      bucket: draft.bucket || '',
      ...(draft.prefix ? { prefix: draft.prefix } : {}),
      ...(draft.fileNameTemplate ? { fileNameTemplate: draft.fileNameTemplate } : {}),
      ...(draft.selectionMode ? { selectionMode: draft.selectionMode } : {}),
      ...(draft.fileErrorPolicy ? { fileErrorPolicy: draft.fileErrorPolicy } : {}),
      authMode: 'access-key',
      ...(draft.accessKeyId ? { accessKeyId: draft.accessKeyId } : {}),
      ...(draft.secretAccessKey ? { secretAccessKey: draft.secretAccessKey } : {}),
      ...(draft.endpoint ? { endpoint: draft.endpoint } : {}),
      ...(draft.mediaType ? { mediaType: draft.mediaType } : {}),
      ...(Object.keys(templateVariables).length ? { templateVariables } : {}),
    };
  }
}
