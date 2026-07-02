// @trace RF-006, RF-007 (catalogo-fuentes: fuente cloud AWS S3) ADR-006
import { Injectable } from '@angular/core';
import { SourceDraft, SourceProvider } from '../../sources/source-provider.abstract';

@Injectable()
export class S3SourceProvider extends SourceProvider {
  override readonly descriptor = {
    type: 'S3',
    label: 'Amazon S3',
    description:
      'Descarga archivos desde un bucket de AWS S3 (o compatible MinIO) seleccionando prefijo y regla de nombre.',
    category: 'Cloud',
    capabilities: ['Bucket + prefijo', 'IAM role / access-key / assume-role', 'Descarga por streaming'],
    supportsConnectionSecret: true,
  } as const;

  override createDraft(): SourceDraft {
    return {
      ...super.createDraft(),
      connectionKind: 's3',
      region: '',
      bucket: '',
      prefix: '',
      fileNameTemplate: '',
      selectionMode: 'latestModified',
      fileErrorPolicy: 'failFast',
      authMode: 'default',
      accessKeyId: '',
      secretAccessKey: '',
      roleArn: '',
      endpoint: '',
      pathStyleAccess: false,
      mediaType: '',
      templateVariablesText: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    const defaults = this.createDraft();
    return {
      ...defaults,
      region: String(configuration['region'] ?? ''),
      bucket: String(configuration['bucket'] ?? ''),
      prefix: String(configuration['prefix'] ?? ''),
      fileNameTemplate: String(configuration['fileNameTemplate'] ?? ''),
      selectionMode: (configuration['selectionMode'] as SourceDraft['selectionMode']) ?? defaults.selectionMode,
      fileErrorPolicy: (configuration['fileErrorPolicy'] as SourceDraft['fileErrorPolicy']) ?? defaults.fileErrorPolicy,
      authMode: configuration['authMode'] as SourceDraft['authMode'] | undefined,
      accessKeyId: String(configuration['accessKeyId'] ?? ''),
      secretAccessKey: String(configuration['secretAccessKey'] ?? ''),
      roleArn: String(configuration['roleArn'] ?? ''),
      endpoint: String(configuration['endpoint'] ?? ''),
      pathStyleAccess: Boolean(configuration['pathStyleAccess'] ?? false),
      mediaType: String(configuration['mediaType'] ?? ''),
      templateVariablesText: this.stringifyTemplateVariables(configuration['templateVariables']),
    };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    const authMode = draft.authMode || 'default';
    const templateVariables = this.parseTemplateVariables(draft.templateVariablesText);
    return {
      region: draft.region || '',
      bucket: draft.bucket || '',
      ...(draft.prefix ? { prefix: draft.prefix } : {}),
      ...(draft.fileNameTemplate ? { fileNameTemplate: draft.fileNameTemplate } : {}),
      ...(draft.selectionMode ? { selectionMode: draft.selectionMode } : {}),
      ...(draft.fileErrorPolicy ? { fileErrorPolicy: draft.fileErrorPolicy } : {}),
      authMode,
      ...(authMode === 'access-key' && draft.accessKeyId ? { accessKeyId: draft.accessKeyId } : {}),
      ...(authMode === 'access-key' && draft.secretAccessKey ? { secretAccessKey: draft.secretAccessKey } : {}),
      ...(authMode === 'assume-role' && draft.roleArn ? { roleArn: draft.roleArn } : {}),
      ...(draft.endpoint ? { endpoint: draft.endpoint } : {}),
      ...(draft.pathStyleAccess ? { pathStyleAccess: true } : {}),
      ...(draft.mediaType ? { mediaType: draft.mediaType } : {}),
      ...(Object.keys(templateVariables).length ? { templateVariables } : {}),
    };
  }
}
