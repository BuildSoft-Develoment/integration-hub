import { InjectionToken, Provider, Type } from '@angular/core';
import { ProcessTaskProvider } from './tasks/process-task-provider.abstract';
import { DbExecuteFunctionTaskProvider } from './implementations/tasks/db-execute-function-task.provider';
import { DbExecuteStoredProcedureTaskProvider } from './implementations/tasks/db-execute-stored-procedure-task.provider';
import { DbWriteTaskProvider } from './implementations/tasks/db-write-task.provider';
import { FileCompressTaskProvider } from './implementations/tasks/file-compress-task.provider';
import { FileDeliverTaskProvider } from './implementations/tasks/file-deliver-task.provider';
import { FileReadTaskProvider } from './implementations/tasks/file-read-task.provider';
import { FileWriteTaskProvider } from './implementations/tasks/file-write-task.provider';
import { NotificationTaskProvider } from './implementations/tasks/notification-task.provider';
import { RestCallTaskProvider } from './implementations/tasks/rest-call-task.provider';

export const PROCESS_TASK_PROVIDERS = new InjectionToken<ReadonlyArray<ProcessTaskProvider<unknown>>>(
  'PROCESS_TASK_PROVIDERS'
);

const PROCESS_TASK_PROVIDER_TYPES: ReadonlyArray<Type<ProcessTaskProvider<unknown>>> = [
  FileReadTaskProvider,
  DbWriteTaskProvider,
  DbExecuteStoredProcedureTaskProvider,
  DbExecuteFunctionTaskProvider,
  RestCallTaskProvider,
  NotificationTaskProvider,
  FileCompressTaskProvider,
  FileDeliverTaskProvider,
  FileWriteTaskProvider,
];

export function provideProcessTaskProviders(): Provider[] {
  return [
    ...PROCESS_TASK_PROVIDER_TYPES,
    ...PROCESS_TASK_PROVIDER_TYPES.map((providerType) => ({
      provide: PROCESS_TASK_PROVIDERS,
      useExisting: providerType,
      multi: true,
    })),
  ];
}
