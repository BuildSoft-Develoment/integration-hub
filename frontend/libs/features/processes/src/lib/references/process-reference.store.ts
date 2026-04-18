import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ProcessApiService } from '../api/process-api.service';
import { ConnectionRef, ReaderRef, SourceRef } from '../models/process.models';

@Injectable()
export class ProcessReferenceStore {
  private readonly api = inject(ProcessApiService);
  private loaded = false;
  private loadOperation: Promise<void> | null = null;

  readonly loading = signal(false);
  readonly sources = signal<SourceRef[]>([]);
  readonly readers = signal<ReaderRef[]>([]);
  readonly connections = signal<ConnectionRef[]>([]);

  async ensureLoaded(): Promise<void> {
    if (this.loaded) {
      return;
    }

    if (this.loadOperation) {
      await this.loadOperation;
      return;
    }

    this.loading.set(true);
    this.loadOperation = (async () => {
      try {
        const [sources, readers, connections] = await Promise.all([
          firstValueFrom(this.api.listSources()),
          firstValueFrom(this.api.listReaders()),
          firstValueFrom(this.api.listConnections()),
        ]);

        this.sources.set(sources);
        this.readers.set(readers);
        this.connections.set(connections);
        this.loaded = true;
      } finally {
        this.loading.set(false);
        this.loadOperation = null;
      }
    })();

    await this.loadOperation;
  }
}
