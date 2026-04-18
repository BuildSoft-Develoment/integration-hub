import {
  ProcessTaskExecutionRecord,
  ProcessedFileFilters,
  ProcessedSourceFileRecord,
  TaskFailureSummary,
  TaskDbWriteSummary,
  TaskProcessedFileSummaryRecord,
  TaskReadSummary,
  TaskSkippedRowRecord,
} from '../models/execution.models';
import { DateTimeService } from '@integration-hub/core/services';

const EXECUTION_DATE_FORMAT = 'dd LLL yyyy, HH:mm:ss';

export interface ParsedTaskPayload {
  outputs?: Record<string, unknown>;
}

export function formatExecutionDate(dateTime: DateTimeService, value: string | null | undefined): string {
  return value ? dateTime.formatIso(value, EXECUTION_DATE_FORMAT) : '-';
}

export function createEmptyProcessedFileFilters(): ProcessedFileFilters {
  return {
    name: '',
    path: '',
    status: '',
    modifiedFrom: '',
    modifiedTo: '',
    minSize: '',
    maxSize: '',
  };
}

export function formatTriggerSourceLabel(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  if (value === 'MANUAL') {
    return 'Manual';
  }
  if (value === 'MANUAL_RETRY_FAILED') {
    return 'Reproceso manual';
  }
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (_match: string, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

export function formatFileSize(value: number | null | undefined): string {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 0) {
    return value == null ? '-' : String(value);
  }
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let current = size / 1024;
  let unitIndex = 0;

  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }

  return `${current.toFixed(current >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function fileReference(file: Pick<ProcessedSourceFileRecord, 'filePath' | 'fileName'>): string {
  return String(file.filePath || file.fileName || '').trim();
}

export function parseTaskPayload(payloadJson: string | null | undefined): ParsedTaskPayload | null {
  if (!payloadJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(payloadJson) as ParsedTaskPayload | null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function formatTaskOutputValue(value: unknown): string {
  if (value == null) {
    return '-';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function taskOutputEntries(payloadJson: string | null | undefined): Array<[string, unknown]> {
  const outputs = parseTaskPayload(payloadJson)?.outputs;
  return outputs && typeof outputs === 'object' ? Object.entries(outputs) : [];
}

export function filterProcessedFileRows(
  rows: readonly ProcessedSourceFileRecord[],
  filters: ProcessedFileFilters
): ProcessedSourceFileRecord[] {
  const normalizedName = String(filters.name || '').trim().toLowerCase();
  const normalizedPath = String(filters.path || '').trim().toLowerCase();
  const normalizedStatus = String(filters.status || '').trim().toUpperCase();
  const modifiedFrom = toFilterTimestamp(filters.modifiedFrom);
  const modifiedTo = toFilterTimestamp(filters.modifiedTo);
  const minSize = filters.minSize === '' ? null : Number(filters.minSize);
  const maxSize = filters.maxSize === '' ? null : Number(filters.maxSize);

  return rows.filter((item) => {
    const fileTime = toFilterTimestamp(item.lastModified);
    const fileSize = item.fileSize == null ? null : Number(item.fileSize);
    const matchesName = !normalizedName || String(item.fileName || '').toLowerCase().includes(normalizedName);
    const matchesPath = !normalizedPath || String(item.filePath || '').toLowerCase().includes(normalizedPath);
    const matchesStatus = !normalizedStatus || String(item.status || '').toUpperCase() === normalizedStatus;
    const matchesModifiedFrom = modifiedFrom == null || (fileTime != null && fileTime >= modifiedFrom);
    const matchesModifiedTo = modifiedTo == null || (fileTime != null && fileTime <= modifiedTo);
    const matchesMinSize = minSize == null || (fileSize != null && fileSize >= minSize);
    const matchesMaxSize = maxSize == null || (fileSize != null && fileSize <= maxSize);

    return (
      matchesName &&
      matchesPath &&
      matchesStatus &&
      matchesModifiedFrom &&
      matchesModifiedTo &&
      matchesMinSize &&
      matchesMaxSize
    );
  });
}

export function buildTaskReadSummary(task: ProcessTaskExecutionRecord | null | undefined): TaskReadSummary | null {
  if (!task) {
    return null;
  }
  if (task.taskType !== 'FILE_READ') {
    return null;
  }
  return mergeReadSummaries(processedFilesSummary(task.processedFiles), parseReadDetails(task.details));
}

export function buildTaskDbWriteSummary(task: ProcessTaskExecutionRecord | null | undefined): TaskDbWriteSummary | null {
  if (!task || task.taskType !== 'DB_WRITE') {
    return null;
  }

  const payload = parseTaskPayload(task.payloadJson) as (ParsedTaskPayload & {
    processedCount?: unknown;
    writtenCount?: unknown;
    mode?: unknown;
    targetTable?: unknown;
  }) | null;
  const outputs = payload?.outputs && typeof payload.outputs === 'object' ? payload.outputs as Record<string, unknown> : {};

  const processedCount = toNullableNumber(outputs['processedCount'] ?? payload?.processedCount);
  const writtenCount = toNullableNumber(outputs['writtenCount'] ?? payload?.writtenCount);
  const mode = toNullableString(outputs['mode'] ?? payload?.mode);
  const targetTable = toNullableString(outputs['targetTable'] ?? payload?.targetTable);

  if (processedCount == null && writtenCount == null && mode == null && targetTable == null) {
    return null;
  }

  return {
    processedCount,
    writtenCount,
    mode,
    targetTable,
  };
}

export function summarizeFailure(details: string | null | undefined): TaskFailureSummary | null {
  const combined = String(details || '').trim();
  if (!combined) {
    return null;
  }

  if (/duplicate key value violates unique constraint|duplicate entry|llave duplicada/i.test(combined)) {
    return {
      title: 'Llave duplicada',
      summary: firstMeaningfulLine(combined),
    };
  }

  const errorLine = combined
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^(ERROR:|Detail:|ORA-|SQLSTATE|PSQLException|Exception|Caused by:)/i.test(line));

  return {
    title: 'Fallo de tarea',
    summary: errorLine || firstMeaningfulLine(combined),
  };
}

export function downloadSkippedRowsCsv(rows: readonly TaskSkippedRowRecord[], fileName: string): void {
  const csvRows = ['rowNumber,reason'];
  rows.forEach((row) => {
    const reason = String(row.reason ?? '').replace(/"/g, '""');
    csvRows.push(`${row.rowNumber ?? ''},"${reason}"`);
  });
  downloadText(csvRows.join('\n'), fileName);
}

export function downloadProcessedFilesCsv(rows: readonly ProcessedSourceFileRecord[], fileName: string): void {
  const csvRows = ['archivo,estado,validos,omitidos,escritos,tamano,ultimaModificacion,ruta,error'];
  rows.forEach((row) => {
    const values = [
      row.fileName ?? '',
      row.status ?? '',
      row.recordCount ?? '',
      row.skippedCount ?? '',
      row.writtenCount ?? '',
      row.fileSize ?? '',
      row.lastModified ?? '',
      row.filePath ?? '',
      row.errorMessage ?? '',
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
    csvRows.push(values.join(','));
  });
  downloadText(csvRows.join('\n'), fileName);
}

function downloadText(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function processedFilesSummary(processedFiles: readonly ProcessedSourceFileRecord[]): TaskReadSummary | null {
  const files = Array.isArray(processedFiles) ? processedFiles : [];
  if (!files.length) {
    return null;
  }

  const completed = files.filter((item) => item.status === 'COMPLETED');
  const failed = files.filter((item) => item.status === 'FAILED');

  return {
    summary: `${files.length} archivos seleccionados`,
    completedFilesCount: completed.length,
    validCount: completed.reduce((sum, item) => sum + Number(item.recordCount || 0), 0),
    skippedCount: completed.reduce((sum, item) => sum + Number(item.skippedCount || 0), 0),
    writtenCount: completed.reduce((sum, item) => sum + Number(item.writtenCount || 0), 0),
    skippedRows: [],
    files: completed.map((item) => ({
      fileName: item.fileName,
      filePath: item.filePath,
      fileSize: item.fileSize,
      lastModified: item.lastModified,
      recordCount: item.recordCount,
      skippedCount: item.skippedCount,
      writtenCount: item.writtenCount,
      status: item.status,
    })),
    failedFiles: failed.map((item) => ({
      fileName: item.fileName,
      filePath: item.filePath,
      fileSize: item.fileSize,
      lastModified: item.lastModified,
      recordCount: item.recordCount,
      skippedCount: item.skippedCount,
      writtenCount: item.writtenCount,
      message: item.errorMessage || '',
      status: item.status,
    })),
  };
}

function parseReadDetails(details: string | null | undefined): TaskReadSummary | null {
  if (!details) {
    return null;
  }

  const lines = details
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return null;
  }

  const summary = lines[0];
  const skippedRows: TaskSkippedRowRecord[] = [];
  const files: TaskProcessedFileSummaryRecord[] = [];
  const failedFiles: TaskProcessedFileSummaryRecord[] = [];
  let collectSkips = false;
  let collectFiles = false;
  let collectFailedFiles = false;

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] === 'Files processed:') {
      collectFiles = true;
      collectSkips = false;
      collectFailedFiles = false;
      continue;
    }
    if (lines[index] === 'Skipped rows:') {
      collectSkips = true;
      collectFiles = false;
      collectFailedFiles = false;
      continue;
    }
    if (lines[index] === 'Failed files:' || lines[index] === 'Failed file:') {
      collectFailedFiles = true;
      collectFiles = false;
      collectSkips = false;
      continue;
    }
    if (collectFiles && lines[index].startsWith('-')) {
      const fileLine = lines[index].replace(/^-\s*/, '');
      const fileMatch = fileLine.match(/^(.*):\s+valid=(\d+),\s+skipped=(\d+)$/i);
      files.push({
        fileName: fileMatch ? fileMatch[1] : fileLine,
        filePath: null,
        fileSize: null,
        lastModified: null,
        recordCount: fileMatch ? Number(fileMatch[2]) : null,
        skippedCount: fileMatch ? Number(fileMatch[3]) : null,
        writtenCount: null,
      });
      continue;
    }
    if (collectFailedFiles && lines[index].startsWith('-')) {
      const failedLine = lines[index].replace(/^-\s*/, '');
      const separatorIndex = failedLine.indexOf(': ');
      failedFiles.push({
        fileName: separatorIndex >= 0 ? failedLine.slice(0, separatorIndex) : failedLine,
        filePath: null,
        fileSize: null,
        lastModified: null,
        recordCount: null,
        skippedCount: null,
        writtenCount: null,
        message: separatorIndex >= 0 ? failedLine.slice(separatorIndex + 2) : '',
      });
      continue;
    }
    if (collectSkips && lines[index].startsWith('-')) {
      const normalized = lines[index].replace(/^-\s*/, '');
      const match = normalized.match(/^row\s+(\d+):\s+(.*)$/i);
      skippedRows.push({
        rowNumber: match ? Number(match[1]) : null,
        reason: match ? match[2] : normalized,
      });
    }
  }

  const successMatch = summary.match(/with\s+(\d+)\s+valid records\s+and\s+(\d+)\s+skipped/i);
  const failureMatch = summary.match(
    /after\s+(\d+)\s+completed files\s+with\s+(\d+)\s+valid records,\s+(\d+)\s+skipped\s+and\s+(\d+)\s+written/i
  );

  return {
    summary,
    completedFilesCount: failureMatch ? Number(failureMatch[1]) : null,
    validCount: successMatch ? Number(successMatch[1]) : failureMatch ? Number(failureMatch[2]) : null,
    skippedCount: successMatch ? Number(successMatch[2]) : failureMatch ? Number(failureMatch[3]) : null,
    writtenCount: failureMatch ? Number(failureMatch[4]) : null,
    skippedRows,
    files,
    failedFiles,
  };
}

function mergeReadSummaries(
  baseSummary: TaskReadSummary | null,
  detailSummary: TaskReadSummary | null
): TaskReadSummary | null {
  if (!baseSummary && !detailSummary) {
    return null;
  }
  if (!baseSummary) {
    return detailSummary;
  }
  if (!detailSummary) {
    return baseSummary;
  }

  return {
    ...baseSummary,
    summary: baseSummary.summary || detailSummary.summary,
    completedFilesCount: baseSummary.completedFilesCount ?? detailSummary.completedFilesCount,
    validCount: baseSummary.validCount ?? detailSummary.validCount,
    skippedCount: baseSummary.skippedCount ?? detailSummary.skippedCount,
    writtenCount: baseSummary.writtenCount ?? detailSummary.writtenCount,
    skippedRows: detailSummary.skippedRows,
    files: baseSummary.files.length ? baseSummary.files : detailSummary.files,
    failedFiles: baseSummary.failedFiles.length ? baseSummary.failedFiles : detailSummary.failedFiles,
  };
}

function toFilterTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function firstMeaningfulLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || ''
  );
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toNullableString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}
