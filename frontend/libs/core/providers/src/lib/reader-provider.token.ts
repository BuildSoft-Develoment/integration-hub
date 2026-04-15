import { InjectionToken, Provider, Type } from '@angular/core';
import { ReaderProvider } from './readers/reader-provider.abstract';
import {
  CsvReaderProvider,
  JsonReaderProvider,
  TxtReaderProvider,
  XlsReaderProvider,
  XlsxReaderProvider,
  XmlReaderProvider,
} from './implementations/readers/reader.providers';

export const READER_PROVIDERS = new InjectionToken<ReadonlyArray<ReaderProvider>>(
  'READER_PROVIDERS'
);

const READER_PROVIDER_TYPES: ReadonlyArray<Type<ReaderProvider>> = [
  TxtReaderProvider,
  CsvReaderProvider,
  XlsReaderProvider,
  XlsxReaderProvider,
  JsonReaderProvider,
  XmlReaderProvider,
];

export function provideReaderProviders(): Provider[] {
  return [
    ...READER_PROVIDER_TYPES,
    ...READER_PROVIDER_TYPES.map((providerType) => ({
      provide: READER_PROVIDERS,
      useExisting: providerType,
      multi: true,
    })),
  ];
}
