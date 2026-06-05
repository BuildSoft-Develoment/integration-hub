import { InjectionToken, Provider, Type } from '@angular/core';
import { SourceProvider } from './sources/source-provider.abstract';
import { FileSystemSourceProvider } from './implementations/sources/file-system-source.provider';
import { FtpSourceProvider } from './implementations/sources/ftp-source.provider';
import { RestSourceProvider } from './implementations/sources/rest-source.provider';
import { S3SourceProvider } from './implementations/sources/s3-source.provider';
import { GcsSourceProvider } from './implementations/sources/gcs-source.provider';
import { AzureBlobSourceProvider } from './implementations/sources/azure-blob-source.provider';
import { SftpSourceProvider } from './implementations/sources/sftp-source.provider';

export const SOURCE_PROVIDERS = new InjectionToken<ReadonlyArray<SourceProvider>>(
  'SOURCE_PROVIDERS'
);

const SOURCE_PROVIDER_TYPES: ReadonlyArray<Type<SourceProvider>> = [
  FileSystemSourceProvider,
  FtpSourceProvider,
  SftpSourceProvider,
  RestSourceProvider,
  S3SourceProvider,
  GcsSourceProvider,
  AzureBlobSourceProvider,
];

export function provideSourceProviders(): Provider[] {
  return [
    ...SOURCE_PROVIDER_TYPES,
    ...SOURCE_PROVIDER_TYPES.map((providerType) => ({
      provide: SOURCE_PROVIDERS,
      useExisting: providerType,
      multi: true,
    })),
  ];
}
