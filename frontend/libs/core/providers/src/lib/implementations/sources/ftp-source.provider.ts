import { Injectable } from '@angular/core';
import { SourceDraft, SourceProvider } from '../../sources/source-provider.abstract';

@Injectable()
export class FtpSourceProvider extends SourceProvider {
  override readonly descriptor = {
    type: 'FTP',
    label: 'FTP',
    description:
      'Ideal para legados simples donde la lectura depende de credenciales y rutas remotas.',
    category: 'Remote',
    capabilities: ['Conexion dinamica', 'Secrets por connectionRef', 'Polling programado'],
    supportsConnectionSecret: true,
  } as const;

  override createDraft(): SourceDraft {
    return {
      ...super.createDraft(),
      connectionKind: 'ftp',
      host: '',
      port: '21',
      username: '',
      password: '',
      remotePath: '',
      fileNameTemplate: '',
      templateVariablesText: '',
      selectionMode: 'latestModified',
      fileErrorPolicy: 'failFast',
      passiveMode: true,
      timeoutMillis: '15000',
      mediaType: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    const defaults = this.createDraft();

    return {
      ...defaults,
      host: String(configuration['host'] ?? ''),
      port: String(configuration['port'] ?? defaults.port ?? '21'),
      username: String(configuration['username'] ?? ''),
      password: String(configuration['password'] ?? ''),
      remotePath: String(configuration['remotePath'] ?? ''),
      fileNameTemplate: String(configuration['fileNameTemplate'] ?? ''),
      templateVariablesText: this.stringifyTemplateVariables(configuration['templateVariables']),
      selectionMode: (configuration['selectionMode'] as SourceDraft['selectionMode']) ?? defaults.selectionMode,
      fileErrorPolicy: (configuration['fileErrorPolicy'] as SourceDraft['fileErrorPolicy']) ?? defaults.fileErrorPolicy,
      passiveMode: Boolean(configuration['passiveMode'] ?? defaults.passiveMode),
      timeoutMillis: String(configuration['timeoutMillis'] ?? defaults.timeoutMillis ?? '15000'),
      mediaType: String(configuration['mediaType'] ?? ''),
    };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    return {
      host: draft.host || '',
      port: Number(draft.port || 21),
      username: draft.username || '',
      password: draft.password || '',
      remotePath: draft.remotePath || '',
      ...(draft.fileNameTemplate ? { fileNameTemplate: draft.fileNameTemplate } : {}),
      ...(draft.fileNameTemplate ? { selectionMode: draft.selectionMode || 'latestModified' } : {}),
      ...(draft.fileNameTemplate ? { fileErrorPolicy: draft.fileErrorPolicy || 'failFast' } : {}),
      ...(draft.templateVariablesText ? { templateVariables: this.parseTemplateVariables(draft.templateVariablesText) } : {}),
      passiveMode: Boolean(draft.passiveMode),
      timeoutMillis: Number(draft.timeoutMillis || 15000),
      ...(draft.mediaType ? { mediaType: draft.mediaType } : {}),
    };
  }
}
