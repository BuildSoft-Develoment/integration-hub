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

export type DbWriteSourceKind = 'field' | 'variable' | 'metadata' | 'summary' | 'records' | 'table' | 'errors' | 'out' | 'fragments' | 'expression';

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
  { key: '_taskDefinitionId', label: '_taskDefinitionId', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_taskOrder', label: '_taskOrder', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_taskRef', label: '_taskRef', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_taskType', label: '_taskType', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_executionMode', label: '_executionMode', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_triggerSource', label: '_triggerSource', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_batchNumber', label: '_batchNumber', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_batchSize', label: '_batchSize', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_batchFrom', label: '_batchFrom', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
  { key: '_batchTo', label: '_batchTo', kind: 'metadata', groupKey: 'ui.dbWriteGroup.metadata' },
];
