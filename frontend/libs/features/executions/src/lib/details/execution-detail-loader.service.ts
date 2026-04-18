import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExecutionApiService } from '../api/execution-api.service';
import { ProcessExecutionRecord, ProcessTaskExecutionRecord } from '../models/execution.models';

export interface ExecutionDetailBundle {
  detail: ProcessExecutionRecord;
  tasks: ProcessTaskExecutionRecord[];
  children: ProcessExecutionRecord[];
}

@Injectable()
export class ExecutionDetailLoaderService {
  private readonly api = inject(ExecutionApiService);

  async load(executionId: number): Promise<ExecutionDetailBundle> {
    const [detail, tasks, children] = await Promise.all([
      firstValueFrom(this.api.get(executionId)),
      firstValueFrom(this.api.listTasks(executionId)),
      firstValueFrom(this.api.listChildren(executionId)),
    ]);

    return { detail, tasks, children };
  }
}
