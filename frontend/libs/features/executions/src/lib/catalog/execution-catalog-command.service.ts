import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppFeedbackService, UiMessageService } from '@integration-hub/core/services';

import { ExecutionApiService } from '../api/execution-api.service';
import { ExecutionCatalogQueryStore } from './execution-catalog-query.store';
import { ExecutionDetailStore } from '../details/execution-detail.store';
import { ExecutionFileActionService } from '../details/execution-file-action.service';
import { ExecutionFileActionRequest } from '../models/execution.models';

@Injectable()
export class ExecutionCatalogCommandService {
  private readonly api = inject(ExecutionApiService);
  private readonly detail = inject(ExecutionDetailStore);
  private readonly fileActions = inject(ExecutionFileActionService);
  private readonly query = inject(ExecutionCatalogQueryStore);
  private readonly feedback = inject(AppFeedbackService);
  private readonly uiMessage = inject(UiMessageService);

  async runFileAction(request: ExecutionFileActionRequest): Promise<void> {
    const execution = this.detail.selectedExecution();
    if (!execution?.processDefinitionId) {
      return;
    }

    const selectedFiles = this.fileActions.selectedFileReferences(request);
    if (!selectedFiles.length) {
      return;
    }

    this.detail.actionRunning.set(true);
    try {
      const result = await firstValueFrom(
        this.api.execute(execution.processDefinitionId, {
          selectedFiles,
          sourceExecutionId: execution.id,
        })
      );

      this.uiMessage.show({
        kind: 'success',
        message: this.fileActions.successMessage(request.kind, result.id),
      });

      await this.query.reload();
      await this.detail.reloadSelectedExecution();
    } catch (error) {
      this.feedback.handleHttpError(error as never);
    } finally {
      this.detail.actionRunning.set(false);
    }
  }
}
