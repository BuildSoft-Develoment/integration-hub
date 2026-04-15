import { Injectable } from '@angular/core';
import { SourceDraft, SourceProvider } from '../../sources/source-provider.abstract';

@Injectable()
export class FileSystemSourceProvider extends SourceProvider {
  override readonly descriptor = {
    type: 'FILESYSTEM',
    label: 'File system',
    description:
      'Trabaja con archivos locales o montados y permite filtros simples por patron.',
    category: 'Local',
    capabilities: ['Lectura incremental', 'Reproceso manual', 'Patrones include/exclude'],
    supportsConnectionSecret: false,
  } as const;

  override createDraft(): SourceDraft {
    return {
      ...super.createDraft(),
      connectionKind: 'filesystem',
      path: '',
      fileNameTemplate: '',
      templateVariablesText: '',
      selectionMode: 'latestModified',
      fileErrorPolicy: 'failFast',
      mediaType: 'application/octet-stream',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    const defaults = this.createDraft();

    return {
      ...defaults,
      path: String(configuration['path'] ?? ''),
      fileNameTemplate: String(configuration['fileNameTemplate'] ?? ''),
      templateVariablesText: this.stringifyTemplateVariables(configuration['templateVariables']),
      selectionMode: (configuration['selectionMode'] as SourceDraft['selectionMode']) ?? defaults.selectionMode,
      fileErrorPolicy: (configuration['fileErrorPolicy'] as SourceDraft['fileErrorPolicy']) ?? defaults.fileErrorPolicy,
      mediaType: String(configuration['mediaType'] ?? defaults.mediaType ?? ''),
    };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    return {
      path: draft.path || '',
      ...(draft.fileNameTemplate ? { fileNameTemplate: draft.fileNameTemplate } : {}),
      ...(draft.fileNameTemplate ? { selectionMode: draft.selectionMode || 'latestModified' } : {}),
      ...(draft.fileNameTemplate ? { fileErrorPolicy: draft.fileErrorPolicy || 'failFast' } : {}),
      ...(draft.templateVariablesText ? { templateVariables: this.parseTemplateVariables(draft.templateVariablesText) } : {}),
      ...(draft.mediaType ? { mediaType: draft.mediaType } : {}),
    };
  }
}
