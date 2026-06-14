import { Injectable } from '@angular/core';
import { SourceDraft, SourceProvider } from '../../sources/source-provider.abstract';

@Injectable()
export class SftpSourceProvider extends SourceProvider {
  override readonly descriptor = {
    type: 'SFTP',
    label: 'SFTP',
    description:
      'Pensado para integraciones seguras con credenciales, llaves y secretos centralizados.',
    category: 'Secure remote',
    capabilities: ['Password o key pair', 'Secrets locales o externos', 'Reintentos robustos'],
    supportsConnectionSecret: true,
  } as const;

  override createDraft(): SourceDraft {
    return {
      ...super.createDraft(),
      connectionKind: 'sftp',
      host: '',
      port: '22',
      username: '',
      password: '',
      remotePath: '',
      fileNameTemplate: '',
      templateVariablesText: '',
      selectionMode: 'latestModified',
      fileErrorPolicy: 'failFast',
      privateKeyPath: '',
      passphrase: '',
      timeoutMillis: '15000',
      strictHostKeyChecking: true,
      knownHostsPath: '',
      mediaType: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    const defaults = this.createDraft();

    return {
      ...defaults,
      host: String(configuration['host'] ?? ''),
      port: String(configuration['port'] ?? defaults.port ?? '22'),
      username: String(configuration['username'] ?? ''),
      password: String(configuration['password'] ?? ''),
      remotePath: String(configuration['remotePath'] ?? ''),
      fileNameTemplate: String(configuration['fileNameTemplate'] ?? ''),
      templateVariablesText: this.stringifyTemplateVariables(configuration['templateVariables']),
      selectionMode: (configuration['selectionMode'] as SourceDraft['selectionMode']) ?? defaults.selectionMode,
      fileErrorPolicy: (configuration['fileErrorPolicy'] as SourceDraft['fileErrorPolicy']) ?? defaults.fileErrorPolicy,
      privateKeyPath: String(configuration['privateKeyPath'] ?? ''),
      passphrase: String(configuration['passphrase'] ?? ''),
      timeoutMillis: String(configuration['timeoutMillis'] ?? defaults.timeoutMillis ?? '15000'),
      strictHostKeyChecking: this.readBoolean(configuration['strictHostKeyChecking'], true),
      knownHostsPath: String(configuration['knownHostsPath'] ?? ''),
      mediaType: String(configuration['mediaType'] ?? ''),
    };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    return {
      host: draft.host || '',
      port: Number(draft.port || 22),
      username: draft.username || '',
      ...(draft.password ? { password: draft.password } : {}),
      remotePath: draft.remotePath || '',
      ...(draft.fileNameTemplate ? { fileNameTemplate: draft.fileNameTemplate } : {}),
      ...(draft.fileNameTemplate ? { selectionMode: draft.selectionMode || 'latestModified' } : {}),
      ...(draft.fileNameTemplate ? { fileErrorPolicy: draft.fileErrorPolicy || 'failFast' } : {}),
      ...(draft.templateVariablesText ? { templateVariables: this.parseTemplateVariables(draft.templateVariablesText) } : {}),
      ...(draft.privateKeyPath ? { privateKeyPath: draft.privateKeyPath } : {}),
      ...(draft.passphrase ? { passphrase: draft.passphrase } : {}),
      timeoutMillis: Number(draft.timeoutMillis || 15000),
      strictHostKeyChecking: Boolean(draft.strictHostKeyChecking),
      ...(draft.knownHostsPath ? { knownHostsPath: draft.knownHostsPath } : {}),
      ...(draft.mediaType ? { mediaType: draft.mediaType } : {}),
    };
  }

  private readBoolean(value: unknown, defaultValue: boolean): boolean {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }
}
