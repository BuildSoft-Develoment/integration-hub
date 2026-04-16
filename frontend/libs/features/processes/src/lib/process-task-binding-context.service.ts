import { Injectable, inject } from '@angular/core';
import {
  ProcessTaskBindingOption,
  ProcessTaskFormModel,
  ReaderProviderType,
  ReaderRef,
  SourceRef,
  SourceDraft,
} from '@integration-hub/core/providers';
import { ReaderManagerService, SourceManagerService } from '@integration-hub/core/services';
import { DB_WRITE_METADATA_ITEMS } from './process-db-write.models';

@Injectable({ providedIn: 'root' })
export class ProcessTaskBindingContextService {
  private readonly readerManager = inject(ReaderManagerService);
  private readonly sourceManager = inject(SourceManagerService);

  buildOptions(task: ProcessTaskFormModel, tasks: readonly ProcessTaskFormModel[], readers: readonly ReaderRef[]): ProcessTaskBindingOption[] {
    const options: ProcessTaskBindingOption[] = [];
    const readTask = this.resolveReadTask(task, tasks);
    if (readTask) {
      const reader = readers.find((item) => item.id === readTask.readerDefinitionId);
      if (reader?.readerType && reader.configurationJson) {
        const readerDraft = this.readerManager.hydrateDraft(reader.readerType as ReaderProviderType, reader.configurationJson);
        const names = [...(readerDraft.fields ?? []), ...(readerDraft.fixedFields ?? [])]
          .map((field) => field.name?.trim())
          .filter((name, index, values) => !!name && values.indexOf(name) === index);
        options.push(
          ...names.map((name) => ({
            key: name!,
            label: name!,
            kind: 'field' as const,
            groupKey: 'ui.dbWriteGroup.fields',
          })),
        );
      }

      const sourceVariables = this.parseObject(readTask.configurationJson, 'sourceVariables');
      Object.keys(sourceVariables)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key) => {
          options.push({
            key,
            label: `{${key}}`,
            kind: 'variable',
            groupKey: 'ui.dbWriteGroup.variables',
          });
        });
    }

    options.push(...DB_WRITE_METADATA_ITEMS);
    return options;
  }

  groupOptions(options: readonly ProcessTaskBindingOption[]): ReadonlyArray<{ key: string; items: readonly ProcessTaskBindingOption[] }> {
    const groups = new Map<string, ProcessTaskBindingOption[]>();
    options.forEach((item) => {
      const list = groups.get(item.groupKey) ?? [];
      list.push(item);
      groups.set(item.groupKey, list);
    });
    return Array.from(groups.entries()).map(([key, items]) => ({ key, items }));
  }

  inferCompatibleReaders(source: SourceRef | null): ReaderProviderType[] {
    if (!source) {
      return [];
    }
    const sourceDraft = this.hydrateSourceDraft(source);
    const explicitMediaType = String(sourceDraft.mediaType || '').toLowerCase();
    const explicitPattern = [
      sourceDraft.fileNameTemplate,
      sourceDraft.fileName,
      sourceDraft.path,
      sourceDraft.remotePath,
      sourceDraft.url,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const byMime = this.readersForMime(explicitMediaType);
    const byPattern = this.readersForPattern(explicitPattern);
    const compatible = new Set<ReaderProviderType>([...byMime, ...byPattern]);
    return Array.from(compatible);
  }

  sourceCompatibilityHint(source: SourceRef | null): string {
    if (!source) {
      return '';
    }
    const sourceDraft = this.hydrateSourceDraft(source);
    const pattern = sourceDraft.fileNameTemplate || sourceDraft.fileName || sourceDraft.path || sourceDraft.remotePath || '';
    if (pattern) {
      return pattern;
    }
    if (sourceDraft.mediaType) {
      return sourceDraft.mediaType;
    }
    return '';
  }

  private hydrateSourceDraft(source: SourceRef): SourceDraft {
    const sourceType = (source.sourceType as any) || 'FILESYSTEM';
    return this.sourceManager.hydrateDraft(sourceType, source.configurationJson || '{}');
  }

  private readersForMime(mediaType: string): ReaderProviderType[] {
    if (!mediaType) {
      return [];
    }
    if (mediaType.includes('csv')) return ['CSV'];
    if (mediaType.includes('json')) return ['JSON'];
    if (mediaType.includes('xml')) return ['XML'];
    if (mediaType.includes('spreadsheetml')) return ['XLSX'];
    if (mediaType.includes('ms-excel')) return ['XLS'];
    if (mediaType.includes('text/plain')) return ['TXT'];
    return [];
  }

  private readersForPattern(pattern: string): ReaderProviderType[] {
    if (!pattern) {
      return [];
    }
    if (pattern.includes('.csv')) return ['CSV'];
    if (pattern.includes('.xlsx')) return ['XLSX'];
    if (pattern.includes('.xls')) return ['XLS'];
    if (pattern.includes('.json')) return ['JSON'];
    if (pattern.includes('.xml')) return ['XML'];
    if (pattern.includes('.txt')) return ['TXT'];
    return [];
  }

  private resolveReadTask(task: ProcessTaskFormModel, tasks: readonly ProcessTaskFormModel[]): ProcessTaskFormModel | null {
    const currentOrder = task.taskOrder;
    const candidates = tasks
      .filter((item) => item.taskType === 'FILE_READ' && item.taskOrder < currentOrder)
      .sort((a, b) => a.taskOrder - b.taskOrder);
    const lastCandidate =
      candidates.length > 0 ? candidates[candidates.length - 1] : null;
    return lastCandidate ?? tasks.find((item) => item.taskType === 'FILE_READ') ?? null;
  }

  private parseObject(configurationJson: string, key: string): Record<string, string> {
    try {
      const parsed = JSON.parse(configurationJson || '{}');
      const value = parsed?.[key];
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
      }
      return Object.entries(value).reduce<Record<string, string>>((accumulator, [entryKey, entryValue]) => {
        accumulator[String(entryKey)] = String(entryValue);
        return accumulator;
      }, {});
    } catch {
      return {};
    }
  }
}
