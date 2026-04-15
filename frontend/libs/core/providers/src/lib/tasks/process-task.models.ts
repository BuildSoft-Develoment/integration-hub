export type ProcessTaskType =
  | 'FILE_READ'
  | 'DB_WRITE'
  | 'DB_EXECUTE_SP'
  | 'DB_EXECUTE_FN'
  | 'REST_CALL'
  | 'NOTIFICATION';

export interface SourceRef {
  id: number;
  name: string;
  sourceType?: string;
  active?: boolean;
  configurationJson?: string;
}

export interface ReaderRef {
  id: number;
  name: string;
  readerType?: string;
  active?: boolean;
  configurationJson?: string;
}

export interface ConnectionRef {
  id: number;
  name: string;
  connectionType: string;
}

export interface ProcessTaskFormModel {
  clientId: string;
  id: number | null;
  taskOrder: number;
  taskType: ProcessTaskType;
  active: boolean;
  sourceDefinitionId: number | null;
  readerDefinitionId: number | null;
  configurationJson: string;
}
