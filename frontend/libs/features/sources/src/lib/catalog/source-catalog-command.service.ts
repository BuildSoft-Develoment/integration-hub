import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AppFeedbackService,
  I18nService,
  SourceManagerService,
} from '@integration-hub/core/services';

import { SourceApiService } from '../api/source-api.service';
import { SourceCatalogQueryStore } from './source-catalog-query.store';
import { SourceEditorStateService } from '../editor/source-editor-state.service';
import { SourceRecord, SourceTestResult } from '../models/source.models';

@Injectable()
export class SourceCatalogCommandService {
  private readonly api = inject(SourceApiService);
  private readonly sourceManager = inject(SourceManagerService);
  private readonly editor = inject(SourceEditorStateService);
  private readonly query = inject(SourceCatalogQueryStore);
  private readonly feedback = inject(AppFeedbackService);
  private readonly i18n = inject(I18nService);

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
      if (result.success) {
        this.editor.testResult.set(result);
        this.feedback.testSuccess('entities.source');
      } else {
        // 003: el backend devuelve success=false + code; mostramos el texto localizado, no el mensaje ingles.
        this.editor.testResult.set({
          success: false,
          message: this.localizeTestFailure(result),
          code: result.code,
        });
      }
    } catch (error) {
      this.editor.testResult.set({
        success: false,
        message: this.resolveErrorMessage(error),
      });
    }
  }

  // 003: traduce el codigo del backend a un mensaje claro en el idioma del usuario. Para GENERIC (sin
  // clasificar) añade el detalle tecnico del backend como respaldo para diagnostico.
  private localizeTestFailure(result: SourceTestResult): string {
    const code = result.code || 'GENERIC';
    const localized = this.i18n.t(`sources.test.${code}`);
    if (code === 'GENERIC' && result.message?.trim()) {
      return `${localized}: ${result.message}`;
    }
    return localized;
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
