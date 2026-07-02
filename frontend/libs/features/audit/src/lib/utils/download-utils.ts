import { AuditRecord } from '../models/audit.models';

export function downloadText(content: string, fileName: string, mimeType = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function eventsToCsv(events: readonly AuditRecord[]): string {
  const header = 'id,eventType,status,message,processExecutionId,taskType,createdAt';
  const rows = events.map(e =>
    [e.id, csvEscape(e.eventType), csvEscape(e.status), csvEscape(e.message ?? ''), e.processExecutionId ?? '', csvEscape(e.taskType ?? ''), e.createdAt ?? ''].join(',')
  );
  return [header, ...rows].join('\r\n');
}

export function eventsToJson(events: readonly AuditRecord[]): string {
  return JSON.stringify(events, null, 2);
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
