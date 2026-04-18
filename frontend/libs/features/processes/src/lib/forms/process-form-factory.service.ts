import { Injectable, inject } from '@angular/core';
import { ProcessFlowMapper } from '../flow/process-flow.mapper';
import { ProcessFlowSyncService } from '../flow/process-flow-sync.service';
import {
  createTaskForm,
  ProcessFormModel,
  ProcessRecord,
  toProcessTaskFormModel,
} from '../models/process.models';

@Injectable({ providedIn: 'root' })
export class ProcessFormFactoryService {
  private readonly mapper = inject(ProcessFlowMapper);
  private readonly flowSync = inject(ProcessFlowSyncService);

  create(): ProcessFormModel {
    const tasks = [createTaskForm('FILE_READ', 1)];
    return {
      id: null,
      name: '',
      description: '',
      active: true,
      scheduled: false,
      scheduleEvery: '',
      nextRunAt: null,
      lastRunAt: null,
      flowLayout: this.mapper.createLayout(tasks),
      tasks,
    };
  }

  fromRecord(process: ProcessRecord): ProcessFormModel {
    const tasks =
      process.tasks?.map((task, index) => ({
        ...toProcessTaskFormModel(task),
        taskOrder: index + 1,
      })) ?? [];

    return {
      id: process.id,
      name: process.name,
      description: process.description,
      active: process.active,
      scheduled: process.scheduled,
      scheduleEvery: process.scheduleEvery,
      nextRunAt: process.nextRunAt,
      lastRunAt: process.lastRunAt,
      flowLayout: this.flowSync.initialize({
        tasks,
        flowLayoutJson: process.flowLayoutJson,
      }),
      tasks,
    };
  }
}
