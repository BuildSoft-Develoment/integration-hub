import { describe, it, expect } from 'vitest';
import {
  CONNECTION_PRESENTATION,
  SOURCE_PRESENTATION,
  READER_PRESENTATION,
  TASK_PRESENTATION,
} from './resource-presentation.maps';

const CONNECTION_TYPES = ['ORACLE', 'POSTGRESQL', 'SQLSERVER', 'MYSQL', 'MONGODB'] as const;
const SOURCE_TYPES = ['FILESYSTEM', 'FTP', 'SFTP', 'REST', 'S3', 'GCS', 'AZURE_BLOB', 'OCI_OBJECT_STORAGE'] as const;
const READER_TYPES = ['TXT', 'CSV', 'XLS', 'XLSX', 'JSON', 'XML', 'SWIFT_MT'] as const;
const TASK_TYPES = [
  'FILE_READ', 'DB_WRITE', 'DB_EXECUTE_SP', 'DB_EXECUTE_FN', 'REST_CALL', 'NOTIFICATION',
  'FILE_WRITE', 'FILE_COMPRESS', 'FILE_DELIVER',
  'MT101_BUILD_FROM_TABLE', 'MT101_VALIDATE', 'MT101_ARCHIVE', 'MT101_PAY',
  'MT101_ROUTE', 'MT101_RECONCILE', 'MT101_STATUS', 'MT101_PARSE',
  'MT101_SPLIT', 'MT101_REPAIR', 'MT101_PARSE_FROM_TABLE', 'MT101_INBOUND_DELIVER',
] as const;

const VALID_ICONS = [
  'database', 'server', 'folder', 'globe', 'file-text', 'table', 'code', 'cloud',
  'cpu', 'play', 'send', 'bell', 'shield', 'git-branch', 'banknote',
  'chevron-left', 'chevron-right', 'x', 'check', 'alert-circle', 'info',
  'search', 'plus', 'minus', 'settings', 'edit', 'trash-2', 'copy', 'download',
  'upload', 'toggle-on', 'toggle-off', 'file', 'clock', 'list', 'alert-triangle',
] as const;

type ValidIcon = typeof VALID_ICONS[number];

function isValidIcon(value: string): value is ValidIcon {
  return (VALID_ICONS as readonly string[]).includes(value);
}

function describeMap<const T extends string>(
  label: string,
  types: readonly T[],
  map: Record<string, { icon: string; toneClass: string }>,
): void {
  describe(label, () => {
    for (const type of types) {
      it(`has presentation for "${type}"`, () => {
        const entry = map[type];
        expect(entry).toBeDefined();
        expect(entry.icon).toBeTruthy();
        expect(isValidIcon(entry.icon)).toBe(true);
        expect(entry.toneClass).toBeTruthy();
        expect(entry.toneClass).toMatch(/^ih-tone-/);
      });
    }

    it('has no extra entries beyond known types', () => {
      const known = new Set(types);
      for (const key of Object.keys(map)) {
        expect(known.has(key as T)).toBe(true);
      }
    });
  });
}

describe('ResourcePresentation maps (no-fallback policy)', () => {
  describeMap('CONNECTION_PRESENTATION', CONNECTION_TYPES, CONNECTION_PRESENTATION);
  describeMap('SOURCE_PRESENTATION', SOURCE_TYPES, SOURCE_PRESENTATION);
  describeMap('READER_PRESENTATION', READER_TYPES, READER_PRESENTATION);
  describeMap('TASK_PRESENTATION', TASK_TYPES, TASK_PRESENTATION);
});
