import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AppFeedbackService,
  ConnectionManagerService,
} from '@integration-hub/core/services';

import { ConnectionApiService } from '../api/connection-api.service';
import { ConnectionCatalogQueryStore } from './connection-catalog-query.store';
import { ConnectionEditorStateService } from '../editor/connection-editor-state.service';
import { ConnectionRecord } from '../models/connection.models';

@Injectable()
export class ConnectionCatalogCommandService {
  private readonly api = inject(ConnectionApiService);
  private readonly connectionManager = inject(ConnectionManagerService);
  private readonly editor = inject(ConnectionEditorStateService);
  private readonly query = inject(ConnectionCatalogQueryStore);
  private readonly feedback = inject(AppFeedbackService);

  async save(): Promise<void> {
    const form = this.editor.form();
    const configurationJson = this.connectionManager.serializeDraft(
      form.connectionType,
      this.editor.draft()
    );
    const payload = {
      name: form.name,
      connectionType: form.connectionType,
      active: form.active,
      configurationJson,
    };
    const saved = form.id
      ? await firstValueFrom(this.api.update(form.id, payload))
      : await firstValueFrom(this.api.create(payload));

    this.query.markSelectedConnection(saved);
    this.editor.viewMode.set('details');
    this.query.openDrawer();
    this.editor.clearTestResult();
    await this.query.reload();
    this.feedback[form.id ? 'updated' : 'created']('entities.connection');
  }

  async testConnection(): Promise<void> {
    try {
      const form = this.editor.form();
      const configurationJson = this.connectionManager.serializeDraft(
        form.connectionType,
        this.editor.draft()
      );
      const payload = {
        name: form.name,
        connectionType: form.connectionType,
        active: form.active,
        configurationJson,
      };
      const result = await firstValueFrom(this.api.test(payload));
      this.editor.testResult.set(result);
      if (result.success) {
        this.feedback.testSuccess('entities.connection');
      }
    } catch (error) {
      this.editor.testResult.set({
        success: false,
        message: this.resolveErrorMessage(error),
      });
    }
  }

  async toggleActive(connection: ConnectionRecord): Promise<void> {
    const updated = await firstValueFrom(
      this.api.setActive(connection.id, !connection.active)
    );
    this.query.markSelectedConnection(updated);
    this.query.openDrawer();
    this.editor.clearTestResult();
    await this.query.reload();
    this.feedback[connection.active ? 'deactivated' : 'activated'](
      'entities.connection'
    );
  }

  async setActiveMany(connectionDefinitionIds: readonly number[], active: boolean): Promise<void> {
    const uniqueIds = Array.from(new Set(connectionDefinitionIds));
    if (uniqueIds.length === 0) {
      return;
    }

    await Promise.all(
      uniqueIds.map((connectionDefinitionId) =>
        firstValueFrom(this.api.setActive(connectionDefinitionId, active))
      )
    );

    this.editor.clearTestResult();
    await this.query.reload();
    this.feedback.info(active ? 'connections.bulkActivated' : 'connections.bulkDeactivated', {
      count: uniqueIds.length,
    });
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
      return error.message || 'Error al probar la conexion.';
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Error al probar la conexion.';
  }
}
