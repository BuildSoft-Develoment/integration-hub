import { effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ExecutionApiService } from '../api/execution-api.service';
import { ExecutionDetailLoaderService } from './execution-detail-loader.service';
import {
  ExecutionProgress,
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
} from '../models/execution.models';
import { ExecutionNavigationService } from './execution-navigation.service';

/**
 * Estados NO terminales de {@code ExecutionStatus} (backend): mientras la ejecución esté en uno de estos,
 * el progreso se pollea en vivo. Terminales (paran el poll): COMPLETED, COMPLETED_WITH_ERRORS, FAILED.
 */
const ACTIVE_STATUSES = new Set(['PENDING', 'RUNNING', 'SUSPENDED']);

/** Cadencia del poll de progreso (ms). Bajo umbral: refresca sin martillar a escala de 1M. */
const PROGRESS_POLL_MS = 4000;

function isActiveStatus(status: string | null | undefined): boolean {
  return status != null && ACTIVE_STATUSES.has(status.toUpperCase());
}

@Injectable()
export class ExecutionDetailStore {
  private readonly detailLoader = inject(ExecutionDetailLoaderService);
  private readonly api = inject(ExecutionApiService);
  private readonly navigation = inject(ExecutionNavigationService);

  readonly loadingDetails = signal(false);
  readonly actionRunning = signal(false);
  readonly tasks = signal<ProcessTaskExecutionRecord[]>([]);
  readonly children = signal<ProcessExecutionRecord[]>([]);
  readonly selectedExecutionId = signal<number | null>(null);
  readonly selectedExecution = signal<ProcessExecutionRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly progress = signal<ExecutionProgress | null>(null);
  readonly navigationStack = this.navigation.navigationStack;

  private pollHandle: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Polling de progreso: vive en la capa de datos (no en el editor presentacional) para re-apuntar
    // solo cuando cambia la ejecución seleccionada o la navegación, y parar al cerrar el drawer.
    effect((onCleanup) => {
      const executionId = this.selectedExecutionId();
      const open = this.drawerOpen();
      this.stopPolling();
      if (executionId == null || !open) {
        return;
      }
      // El tick se auto-detiene al alcanzar estado terminal (ver pollTick).
      this.pollHandle = setInterval(() => void this.pollTick(executionId), PROGRESS_POLL_MS);
      onCleanup(() => this.stopPolling());
    });
  }

  async selectExecution(execution: ProcessExecutionRecord): Promise<void> {
    this.navigation.reset();
    await this.loadExecutionDetails(execution.id, { openDrawer: true });
  }

  async openRelatedExecution(executionId: number): Promise<void> {
    if (this.navigation.trimTo(executionId)) {
      await this.loadExecutionDetails(executionId, { openDrawer: true });
      return;
    }

    this.navigation.pushCurrentExecution(this.selectedExecution(), executionId);
    await this.loadExecutionDetails(executionId, { openDrawer: true });
  }

  async goBackToPreviousExecution(): Promise<void> {
    const previous = this.navigation.popPrevious();
    if (!previous) {
      return;
    }

    await this.loadExecutionDetails(previous.executionId, { openDrawer: true });
  }

  closeDrawer(): void {
    this.stopPolling();
    this.drawerOpen.set(false);
  }

  refreshSelectedExecution(execution: ProcessExecutionRecord): void {
    if (this.selectedExecutionId() !== execution.id) {
      return;
    }

    this.selectedExecution.set(execution);
  }

  markSelectedExecution(executionId: number): void {
    this.selectedExecutionId.set(executionId);
  }

  async reloadSelectedExecution(): Promise<void> {
    const executionId = this.selectedExecutionId();
    if (executionId == null) {
      return;
    }

    await this.loadExecutionDetails(executionId, { openDrawer: false });
  }

  private async loadExecutionDetails(
    executionId: number,
    options: { openDrawer: boolean }
  ): Promise<void> {
    this.selectedExecutionId.set(executionId);
    this.progress.set(null); // no arrastrar el progreso de la ejecución anterior
    this.loadingDetails.set(true);
    if (options.openDrawer) {
      this.drawerOpen.set(true);
    }

    try {
      const { detail, tasks, children } = await this.detailLoader.load(executionId);
      this.selectedExecution.set(detail);
      this.tasks.set(tasks);
      this.children.set(children);
      // Progreso inicial best-effort (no bloquea ni rompe el detalle si falla).
      void this.fetchProgress(executionId);
    } finally {
      this.loadingDetails.set(false);
    }
  }

  private async fetchProgress(executionId: number): Promise<void> {
    try {
      const progress = await firstValueFrom(this.api.progress(executionId));
      if (this.selectedExecutionId() === executionId) {
        this.progress.set(progress);
      }
    } catch {
      // best-effort: la ausencia de progreso no debe romper el detalle.
    }
  }

  /** Tick del poll: refresca detalle+tareas+progreso en silencio (sin spinner) y para al terminar. */
  private async pollTick(executionId: number): Promise<void> {
    if (this.selectedExecutionId() !== executionId) {
      this.stopPolling();
      return;
    }
    try {
      const [bundle, progress] = await Promise.all([
        this.detailLoader.load(executionId),
        firstValueFrom(this.api.progress(executionId)),
      ]);
      if (this.selectedExecutionId() !== executionId) {
        return; // el usuario navegó a otra ejecución mientras cargaba
      }
      this.selectedExecution.set(bundle.detail);
      this.tasks.set(bundle.tasks);
      this.children.set(bundle.children);
      this.progress.set(progress);
      if (!isActiveStatus(bundle.detail.status)) {
        this.stopPolling(); // terminal: esta es la última foto
      }
    } catch {
      // best-effort: un fallo transitorio no detiene el poll; se reintenta en el próximo tick.
    }
  }

  private stopPolling(): void {
    if (this.pollHandle != null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}
