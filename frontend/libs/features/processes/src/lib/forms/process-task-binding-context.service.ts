import { Injectable, inject } from '@angular/core';
import {
  ProcessTaskInputDraft,
  ProcessTaskBindingOption,
  ProcessTaskOutputKind,
  ProcessTaskFormModel,
  ReaderProviderType,
  ReaderRef,
  SourceRef,
  SourceDraft,
} from '@integration-hub/core/providers';
import { ReaderManagerService, SourceManagerService } from '@integration-hub/core/services';
import { DB_WRITE_METADATA_ITEMS } from '../models/process-db-write.models';

@Injectable({ providedIn: 'root' })
export class ProcessTaskBindingContextService {
  private readonly readerManager = inject(ReaderManagerService);
  private readonly sourceManager = inject(SourceManagerService);

  buildOptions(task: ProcessTaskFormModel, tasks: readonly ProcessTaskFormModel[], readers: readonly ReaderRef[], input?: ProcessTaskInputDraft): ProcessTaskBindingOption[] {
    const options: ProcessTaskBindingOption[] = [];
    options.push(...DB_WRITE_METADATA_ITEMS);
    const resolvedInput = input ?? this.configuredInput(task, tasks);
    const sourceTask = this.resolveTaskByRef(resolvedInput?.sourceTaskRef || '', tasks);
    if (sourceTask) {
      this.availableOutputsForTask(sourceTask)
        .filter((output) => output !== 'metadata')
        .forEach((output) => {
          options.push(...this.optionsForOutput(sourceTask, output, readers));
        });
    }
    return options;
  }

  previousTaskOptions(task: ProcessTaskFormModel, tasks: readonly ProcessTaskFormModel[]): ReadonlyArray<{ taskRef: string; label: string; taskType: string; taskOrder: number }> {
    return tasks
      .filter((item) => item.taskOrder < task.taskOrder)
      .sort((left, right) => left.taskOrder - right.taskOrder)
      .map((item) => {
        const config = this.parseJson(item.configurationJson);
        const taskRef = this.taskRef(item, config);
        return {
          taskRef,
          label: `${taskRef} - ${item.taskType}`,
          taskType: item.taskType,
          taskOrder: item.taskOrder,
        };
      });
  }

  availableOutputsForTask(task: ProcessTaskFormModel | null): ProcessTaskOutputKind[] {
    if (!task) {
      return [];
    }
    switch (task.taskType) {
      case 'FILE_READ':
        return ['metadata', 'summary', 'records', 'errors'];
      case 'DB_WRITE':
        return ['metadata', 'summary', 'table', 'errors'];
      case 'DB_EXECUTE_SP':
      case 'DB_EXECUTE_FN':
        return ['metadata', 'summary', 'out', 'errors'];
      case 'REST_CALL':
      case 'NOTIFICATION':
        return ['metadata', 'summary', 'errors'];
      default:
        return ['metadata', 'summary', 'errors'];
    }
  }

  defaultOutputForTask(task: ProcessTaskFormModel | null): ProcessTaskOutputKind {
    if (!task) {
      return 'metadata';
    }
    switch (task.taskType) {
      case 'DB_WRITE':
        return 'table';
      case 'DB_EXECUTE_SP':
      case 'DB_EXECUTE_FN':
        return 'out';
      case 'FILE_READ':
        return 'records';
      default:
        return 'summary';
    }
  }

  configuredInput(task: ProcessTaskFormModel, tasks: readonly ProcessTaskFormModel[]): ProcessTaskInputDraft | undefined {
    const config = this.parseJson(task.configurationJson);
    const rawInput = config['input'];
    if (rawInput && typeof rawInput === 'object' && !Array.isArray(rawInput)) {
      const input = rawInput as Record<string, unknown>;
      const sourceTaskRef = String(input['sourceTaskRef'] || '').trim();
      if (sourceTaskRef) {
        return {
          source: 'task-output',
          sourceTaskRef,
          sourceOutput: this.normalizeOutput(input['sourceOutput']),
          ...(input['batchSize'] != null && String(input['batchSize']).trim() ? { batchSize: String(input['batchSize']) } : {}),
        };
      }
    }
    const previous = this.previousTaskOptions(task, tasks);
    const lastPrevious = previous.length ? previous[previous.length - 1] : null;
    if (!lastPrevious) {
      return undefined;
    }
    const sourceTask = this.resolveTaskByRef(lastPrevious.taskRef, tasks);
    return {
      source: 'task-output',
      sourceTaskRef: lastPrevious.taskRef,
      sourceOutput: this.defaultOutputForTask(sourceTask),
    };
  }

  resolveTaskByRef(taskRef: string, tasks: readonly ProcessTaskFormModel[]): ProcessTaskFormModel | null {
    const normalized = String(taskRef || '').trim();
    if (!normalized) {
      return null;
    }
    return tasks.find((item) => this.taskRef(item, this.parseJson(item.configurationJson)) === normalized) ?? null;
  }

  isFileRecordsInput(input: ProcessTaskInputDraft | undefined, tasks: readonly ProcessTaskFormModel[]): boolean {
    if (!input?.sourceTaskRef || input.sourceOutput !== 'records') {
      return false;
    }
    return this.resolveTaskByRef(input.sourceTaskRef, tasks)?.taskType === 'FILE_READ';
  }

  isFileInput(input: ProcessTaskInputDraft | undefined, tasks: readonly ProcessTaskFormModel[]): boolean {
    if (!input?.sourceTaskRef) {
      return false;
    }
    return this.resolveTaskByRef(input.sourceTaskRef, tasks)?.taskType === 'FILE_READ';
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

  private optionsForOutput(sourceTask: ProcessTaskFormModel, sourceOutput: ProcessTaskOutputKind, readers: readonly ReaderRef[]): ProcessTaskBindingOption[] {
    const config = this.parseJson(sourceTask.configurationJson);
    switch (sourceOutput) {
      case 'records':
        return sourceTask.taskType === 'FILE_READ' ? this.readerFieldOptions(sourceTask, readers) : [];
      case 'table':
        return this.tableColumnOptions(config);
      case 'out':
        return this.routineOutputNames(config).map((name) => ({
          key: name,
          label: name,
          kind: 'out' as const,
          groupKey: 'ui.dbWriteGroup.out',
        }));
      case 'summary':
        return this.summaryOptions(sourceTask);
      case 'errors':
        return ['lineNumber', 'message', 'rawValue'].map((name) => ({
          key: name,
          label: name,
          kind: 'errors' as const,
          groupKey: 'ui.dbWriteGroup.errors',
        }));
      default:
        return [];
    }
  }

  private readerFieldOptions(readTask: ProcessTaskFormModel, readers: readonly ReaderRef[]): ProcessTaskBindingOption[] {
    const options: ProcessTaskBindingOption[] = [];
    const reader = readers.find((item) => item.id === readTask.readerDefinitionId);
    if (reader?.readerType && reader.configurationJson) {
      const readerDraft = this.readerManager.hydrateDraft(reader.readerType as ReaderProviderType, reader.configurationJson);
      const names = [...(readerDraft.fields ?? []), ...(readerDraft.fixedFields ?? [])]
        .map((field) => field.name?.trim())
        .filter((name, index, values) => !!name && values.indexOf(name) === index);
      options.push(...names.map((name) => ({
        key: name!,
        label: name!,
        kind: 'records' as const,
        groupKey: 'ui.dbWriteGroup.records',
      })));
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
    return options;
  }

  private tableColumnOptions(config: Record<string, unknown>): ProcessTaskBindingOption[] {
    const names = new Set<string>();
    [config['columnMappings'], config['columnFunctions']].forEach((value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.keys(value).forEach((name) => names.add(name));
      }
    });
    const keyColumns = Array.isArray(config['keyColumns']) ? config['keyColumns'] : [];
    keyColumns.map((name) => String(name || '').trim()).filter(Boolean).forEach((name) => names.add(name));
    return Array.from(names).sort((left, right) => left.localeCompare(right)).map((name) => ({
      key: name,
      label: name,
      kind: 'table' as const,
      groupKey: 'ui.dbWriteGroup.table',
    }));
  }

  private summaryOptions(task: ProcessTaskFormModel): ProcessTaskBindingOption[] {
    const byType: Record<string, string[]> = {
      FILE_READ: ['recordCount', 'skippedCount', 'sourceFileName', 'sourceFilePath', 'sourceMediaType', 'sourceFileSize', 'sourceLastModified'],
      DB_WRITE: ['processedCount', 'writtenCount', 'targetTable', 'mode', 'batchCount'],
      DB_EXECUTE_SP: ['batchCount'],
      DB_EXECUTE_FN: ['batchCount'],
      REST_CALL: ['processedCount', 'batchCount'],
      NOTIFICATION: ['batchCount'],
    };
    return (byType[task.taskType] ?? ['batchCount']).map((name) => ({
      key: name,
      label: name,
      kind: 'summary' as const,
      groupKey: 'ui.dbWriteGroup.summary',
    }));
  }

  private routineOutputNames(config: Record<string, unknown>): string[] {
    const names = new Set<string>();
    const resultAlias = String(config['resultAlias'] || '').trim();
    if (resultAlias) {
      names.add(resultAlias);
    }
    const parameters = Array.isArray(config['parameters']) ? config['parameters'] : [];
    parameters
      .filter((parameter: any) => ['OUT', 'INOUT'].includes(String(parameter?.direction || '').toUpperCase()))
      .map((parameter: any) => String(parameter?.name || '').trim())
      .filter(Boolean)
      .forEach((name) => names.add(name));
    return Array.from(names).sort((left, right) => left.localeCompare(right));
  }

  private normalizeOutput(value: unknown): ProcessTaskOutputKind {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'metadata'
      || normalized === 'summary'
      || normalized === 'records'
      || normalized === 'table'
      || normalized === 'errors'
      || normalized === 'out'
      ? normalized
      : 'records';
  }

  taskRef(task: ProcessTaskFormModel, config: Record<string, unknown>): string {
    const configuredRef = String(config['taskRef'] || '').trim();
    return configuredRef || `task-${task.taskOrder}`;
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

  private parseJson(configurationJson: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(configurationJson || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
}
