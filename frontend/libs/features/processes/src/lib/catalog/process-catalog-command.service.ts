import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppFeedbackService, ProcessExecutionApiService } from '@integration-hub/core/services';

import { ProcessApiService } from '../api/process-api.service';
import { ProcessCatalogQueryStore } from './process-catalog-query.store';
import { ProcessEditorStore } from '../editor/process-editor.store';
import { ProcessFlowApiService } from '../api/process-flow-api.service';
import { ProcessFlowSyncService } from '../flow/process-flow-sync.service';
import { normalizeTaskOrders, ProcessRecord } from '../models/process.models';

@Injectable()
export class ProcessCatalogCommandService {
  private readonly api = inject(ProcessApiService);
  private readonly execution = inject(ProcessExecutionApiService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly editor = inject(ProcessEditorStore);
  private readonly query = inject(ProcessCatalogQueryStore);
  private readonly flowApi = inject(ProcessFlowApiService);
  private readonly flowSync = inject(ProcessFlowSyncService);

  async save(): Promise<void> {
    await this.editor.trackSaving(async () => {
      const form = this.editor.form();
      const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
        scheduled: form.scheduled,
        scheduleEvery: form.scheduled ? form.scheduleEvery : '',
        flowLayoutJson: this.flowApi.serialize(
          this.flowSync.synchronizeLayout(form.flowLayout, form.tasks)
        ),
        tasks: normalizeTaskOrders(form.tasks).map((task, index) => ({
          taskOrder: index + 1,
          taskType: task.taskType,
          sourceDefinitionId:
            task.taskType === 'FILE_READ' ? task.sourceDefinitionId : null,
          readerDefinitionId:
            task.taskType === 'FILE_READ' ? task.readerDefinitionId : null,
          configurationJson: task.configurationJson?.trim() || '{}',
        })),
      };
      const saved = form.id
        ? await firstValueFrom(this.api.update(form.id, payload))
        : await firstValueFrom(this.api.create(payload));

      this.editor.showSavedProcess(saved);
      await this.query.reload();
      this.feedback[form.id ? 'updated' : 'created']('entities.process');
    });
  }

  async toggleActive(process: ProcessRecord): Promise<void> {
    const updated = await firstValueFrom(
      this.api.setActive(process.id, !process.active)
    );
    this.editor.openSelectedProcess(updated);
    await this.query.reload();
    this.feedback[process.active ? 'deactivated' : 'activated'](
      'entities.process'
    );
  }

  async execute(process: ProcessRecord): Promise<void> {
    await this.editor.trackExecuting(async () => {
      const execution = await firstValueFrom(this.execution.execute(process.id));
      this.feedback.info('processes.queued', {
        id: execution.id,
        status: execution.status,
      });
      await this.query.reload();
      this.editor.markSelectedProcess(process.id);
      this.editor.drawerOpen.set(true);
    });
  }
}
