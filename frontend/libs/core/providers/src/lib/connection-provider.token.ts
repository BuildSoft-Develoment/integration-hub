import { InjectionToken, Provider, Type } from '@angular/core';
import { ConnectionProvider } from './connections/connection-provider.abstract';
import { MongoDbConnectionProvider } from './implementations/connections/mongodb-connection.provider';
import { MySqlConnectionProvider } from './implementations/connections/mysql-connection.provider';
import { OracleConnectionProvider } from './implementations/connections/oracle-connection.provider';
import { PostgreSqlConnectionProvider } from './implementations/connections/postgresql-connection.provider';
import { SqlServerConnectionProvider } from './implementations/connections/sqlserver-connection.provider';

export const CONNECTION_PROVIDERS = new InjectionToken<ReadonlyArray<ConnectionProvider>>(
  'CONNECTION_PROVIDERS'
);

const CONNECTION_PROVIDER_TYPES: ReadonlyArray<Type<ConnectionProvider>> = [
  OracleConnectionProvider,
  PostgreSqlConnectionProvider,
  SqlServerConnectionProvider,
  MySqlConnectionProvider,
  MongoDbConnectionProvider,
];

export function provideConnectionProviders(): Provider[] {
  return [
    ...CONNECTION_PROVIDER_TYPES,
    ...CONNECTION_PROVIDER_TYPES.map((providerType) => ({
      provide: CONNECTION_PROVIDERS,
      useExisting: providerType,
      multi: true,
    })),
  ];
}
