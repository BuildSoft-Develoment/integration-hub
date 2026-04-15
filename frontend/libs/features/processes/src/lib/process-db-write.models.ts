export interface DbWriteSchemaRef {
  name: string;
}

export interface DbWriteTableRef {
  schema: string | null;
  name: string;
  qualifiedName: string;
}

export interface DbWriteColumnRef {
  schema: string | null;
  table: string | null;
  name: string;
  dataType: string | null;
  nullable: boolean;
  size: number | null;
  scale: number | null;
}

export type DbWriteSourceKind = 'field' | 'variable' | 'metadata' | 'expression';

export interface DbWriteSourceItem {
  key: string;
  label: string;
  kind: Exclude<DbWriteSourceKind, 'expression'>;
  groupKey: string;
  hint?: string;
}

export interface DbWriteMappingRow {
  targetColumn: string;
  sourceKind: DbWriteSourceKind | null;
  sourceKey: string;
  sourceLabel: string;
  expression: string;
  key: boolean;
}

export const DB_WRITE_METADATA_ITEMS: readonly DbWriteSourceItem[] = [
  { key: '_processExecutionId', label: '_processExecutionId', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_executionId', label: '_executionId', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_taskDefinitionId', label: '_taskDefinitionId', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_recordCount', label: '_recordCount', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_skippedCount', label: '_skippedCount', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_sourceFileName', label: '_sourceFileName', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_sourceFilePath', label: '_sourceFilePath', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_sourceMediaType', label: '_sourceMediaType', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_sourceFileSize', label: '_sourceFileSize', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_sourceLastModified', label: '_sourceLastModified', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
];
