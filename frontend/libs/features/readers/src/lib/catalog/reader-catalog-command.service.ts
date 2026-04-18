import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AppFeedbackService,
  ReaderManagerService,
} from '@integration-hub/core/services';

import { ReaderApiService } from '../api/reader-api.service';
import { ReaderCatalogQueryStore } from './reader-catalog-query.store';
import { ReaderEditorStateService } from '../editor/reader-editor-state.service';
import { ReaderRecord } from '../models/reader.models';

@Injectable()
export class ReaderCatalogCommandService {
  private readonly api = inject(ReaderApiService);
  private readonly readerManager = inject(ReaderManagerService);
  private readonly editor = inject(ReaderEditorStateService);
  private readonly query = inject(ReaderCatalogQueryStore);
  private readonly feedback = inject(AppFeedbackService);

  async save(): Promise<void> {
    const form = this.editor.form();
    const configurationJson = this.readerManager.serializeDraft(
      form.readerType,
      this.editor.draft()
    );
    const payload = {
      name: form.name,
      readerType: form.readerType,
      active: form.active,
      configurationJson,
    };
    const saved = form.id
      ? await firstValueFrom(this.api.update(form.id, payload))
      : await firstValueFrom(this.api.create(payload));

    this.query.markSelectedReader(saved);
    this.editor.viewMode.set('details');
    this.query.openDrawer();
    await this.query.reload();
    this.feedback[form.id ? 'updated' : 'created']('entities.reader');
  }

  async toggleActive(reader: ReaderRecord): Promise<void> {
    const updated = await firstValueFrom(this.api.setActive(reader.id, !reader.active));
    this.query.markSelectedReader(updated);
    this.query.openDrawer();
    await this.query.reload();
    this.feedback[reader.active ? 'deactivated' : 'activated']('entities.reader');
  }
}
