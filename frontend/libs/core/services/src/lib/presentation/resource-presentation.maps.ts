import { ResourcePresentation } from '@integration-hub/shared/models';
import {
  ConnectionProviderType,
  PlatformProcessTaskType,
  ReaderProviderType,
  SourceProviderType,
} from '@integration-hub/core/providers';

/**
 * Mapas TOTALES de presentacion por dominio (politica no-fallback).
 *
 * <p>Cada mapa es un `Record<Type, ResourcePresentation>`: TypeScript exige
 * cubrir TODAS las variantes del union type. Anadir un nuevo tipo de recurso
 * sin su presentacion es error de compilacion, no un respaldo en runtime.</p>
 *
 * <p>Se consumen exclusivamente a traves de los managers
 * (`ConnectionManagerService`, `SourceManagerService`, `ReaderManagerService`),
 * nunca directamente desde los componentes (DIP).</p>
 */

export const CONNECTION_PRESENTATION: Record<ConnectionProviderType, ResourcePresentation> = {
  ORACLE: { icon: 'database', toneClass: 'ih-tone-database' },
  POSTGRESQL: { icon: 'database', toneClass: 'ih-tone-database' },
  SQLSERVER: { icon: 'database', toneClass: 'ih-tone-database' },
  MYSQL: { icon: 'database', toneClass: 'ih-tone-database' },
  MONGODB: { icon: 'server', toneClass: 'ih-tone-document' },
};

export const SOURCE_PRESENTATION: Record<SourceProviderType, ResourcePresentation> = {
  FILESYSTEM: { icon: 'folder', toneClass: 'ih-tone-storage' },
  FTP: { icon: 'server', toneClass: 'ih-tone-network' },
  SFTP: { icon: 'shield', toneClass: 'ih-tone-network' },
  REST: { icon: 'globe', toneClass: 'ih-tone-integration' },
  S3: { icon: 'cloud', toneClass: 'ih-tone-cloud' },
  GCS: { icon: 'cloud', toneClass: 'ih-tone-cloud' },
  AZURE_BLOB: { icon: 'cloud', toneClass: 'ih-tone-cloud' },
  OCI_OBJECT_STORAGE: { icon: 'cloud', toneClass: 'ih-tone-cloud' },
};

export const READER_PRESENTATION: Record<ReaderProviderType, ResourcePresentation> = {
  TXT: { icon: 'file-text', toneClass: 'ih-tone-document' },
  CSV: { icon: 'table', toneClass: 'ih-tone-document' },
  XLS: { icon: 'table', toneClass: 'ih-tone-document' },
  XLSX: { icon: 'table', toneClass: 'ih-tone-document' },
  JSON: { icon: 'code', toneClass: 'ih-tone-integration' },
  XML: { icon: 'code', toneClass: 'ih-tone-integration' },
  SWIFT_MT: { icon: 'banknote', toneClass: 'ih-tone-payment' },
};

export const TASK_PRESENTATION: Record<PlatformProcessTaskType, ResourcePresentation> = {
  FILE_READ: { icon: 'file-text', toneClass: 'ih-tone-document' },
  DB_WRITE: { icon: 'database', toneClass: 'ih-tone-database' },
  DB_EXECUTE_SP: { icon: 'database', toneClass: 'ih-tone-database' },
  DB_EXECUTE_FN: { icon: 'database', toneClass: 'ih-tone-database' },
  REST_CALL: { icon: 'globe', toneClass: 'ih-tone-integration' },
  NOTIFICATION: { icon: 'bell', toneClass: 'ih-tone-document' },
  MT101_BUILD: { icon: 'file', toneClass: 'ih-tone-payment' },
  MT101_BUILD_FROM_TABLE: { icon: 'table', toneClass: 'ih-tone-payment' },
  MT101_VALIDATE: { icon: 'check', toneClass: 'ih-tone-payment' },
  MT101_ARCHIVE: { icon: 'download', toneClass: 'ih-tone-payment' },
  MT101_PAY: { icon: 'send', toneClass: 'ih-tone-payment' },
  MT101_ROUTE: { icon: 'git-branch', toneClass: 'ih-tone-payment' },
  MT101_RECONCILE: { icon: 'list', toneClass: 'ih-tone-payment' },
  MT101_STATUS: { icon: 'clock', toneClass: 'ih-tone-payment' },
  MT101_PARSE: { icon: 'code', toneClass: 'ih-tone-payment' },
  MT101_SPLIT: { icon: 'git-branch', toneClass: 'ih-tone-payment' },
  MT101_REPAIR: { icon: 'alert-triangle', toneClass: 'ih-tone-payment' },
  MT101_PARSE_FROM_TABLE: { icon: 'table', toneClass: 'ih-tone-payment' },
  MT101_INBOUND_DELIVER: { icon: 'send', toneClass: 'ih-tone-payment' },
};
