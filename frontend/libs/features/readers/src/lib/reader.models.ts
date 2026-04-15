import { ReaderDraft, ReaderProviderType } from '@integration-hub/core/providers';

export interface ReaderRecord {
  id: number;
  name: string;
  readerType: ReaderProviderType;
  active: boolean;
  configurationJson: string;
}

export interface ReaderFormModel {
  id: number | null;
  name: string;
  readerType: ReaderProviderType;
  active: boolean;
  configurationJson: string;
}

export function toReaderFormModel(reader: ReaderRecord): ReaderFormModel {
  return {
    id: reader.id,
    name: reader.name,
    readerType: reader.readerType,
    active: reader.active,
    configurationJson: reader.configurationJson,
  };
}

export function createReaderForm(readerType: ReaderProviderType): ReaderFormModel {
  return {
    id: null,
    name: '',
    readerType,
    active: true,
    configurationJson: '{}',
  };
}

export type EditableReaderDraft = ReaderDraft;
