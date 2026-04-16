import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AppFeedbackService,
  SourceManagerService,
} from '@integration-hub/core/services';

import { SourceApiService } from './source-api.service';
import { SourceCatalogQueryStore } from './source-catalog-query.store';
import { SourceEditorStateService } from './source-editor-state.service';
import { SourceRecord } from './source.models';

@Injectable()
export class SourceCatalogCommandService {
  private readonly api = inject(SourceApiService);
  private readonly sourceManager = inject(SourceManagerService);
  private readonly editor = inject(SourceEditorStateService);
  private readonly query = inject(SourceCatalogQueryStore);
  private readonly feedback = inject(AppFeedbackService);

  async save(): Promise<void> {
    const form = this.editor.form();
    const configurationJson = this.sourceManager.serializeDraft(
      form.sourceType,
      this.editor.draft()
    );

    const payload = {
      name: form.name,
      sourceType: form.sourceType,
      active: form.active,
      configurationJson,
    };

    const saved = form.id
      ? await firstValueFrom(this.api.update(form.id, payload))
      : await firstValueFrom(this.api.create(payload));

    this.query.markSelectedSource(saved);
    this.editor.viewMode.set('details');
    this.query.openDrawer();
    this.editor.clearTestResult();
    await this.query.reload();
    this.feedback[form.id ? 'updated' : 'created']('entities.source');
  }

  async testSource(): Promise<void> {
    try {
      const form = this.editor.form();
      const configurationJson = this.sourceManager.serializeDraft(
        form.sourceType,
        this.editor.draft()
      );
      const payload = {
        name: form.name,
        sourceType: form.sourceType,
        active: form.active,
        configurationJson,
      };
      const result = await firstValueFrom(this.api.test(payload));
      this.editor.testResult.set(result);
      if (result.success) {
        this.feedback.testSuccess('entities.source');
      }
    } catch (error) {
      this.editor.testResult.set({
        success: false,
        message: this.resolveErrorMessage(error),
      });
    }
  }

  async toggleActive(source: SourceRecord): Promise<void> {
    const updated = await firstValueFrom(this.api.setActive(source.id, !source.active));
    this.query.markSelectedSource(updated);
    this.query.openDrawer();
    this.editor.clearTestResult();
    await this.query.reload();
    this.feedback[source.active ? 'deactivated' : 'activated']('entities.source');
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as Record<string, unknown> | string | null;
      if (typeof payload === 'string' && payload.trim()) {
        return payload;
      }
      if (payload && typeof payload === 'object') {
        const details = payload['details'];
        const message = payload['message'];
        if (typeof details === 'string' && details.trim()) {
          return details;
        }
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
      return error.message || 'Error al probar la fuente.';
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Error al probar la fuente.';
  }
}
