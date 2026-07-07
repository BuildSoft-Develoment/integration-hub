import { inject, Injectable, signal } from '@angular/core';
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

function isActiveStatus(status: string | null | undefined): boolean {
  return status != null && ACTIVE_STATUSES.has(status.toUpperCase());
}

/**
 * Dueño de los datos del detalle de ejecución (SRP): carga detalle/tareas/hijos/progreso y expone las
 * señales + un {@link refreshLiveSnapshot} para el refresco en vivo. El <b>scheduling</b> del polling
 * (cuándo/cada-cuánto/hasta-cuándo) vive en {@code ExecutionProgressPoller}, no aquí.
 */
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
    // Cerrar el drawer detiene el polling: el poller reacciona a drawerOpen=false.
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

  /**
   * Refresco en vivo (silencioso, sin spinner) de detalle+tareas+progreso para el poller. Devuelve si la
   * ejecución sigue <b>activa</b> (para que el poller siga o pare), o {@code null} si el usuario ya navegó
   * a otra ejecución (poller debe parar). Best-effort: un fallo transitorio se reporta como activo (reintenta).
   */
  async refreshLiveSnapshot(executionId: number): Promise<{ active: boolean } | null> {
    if (this.selectedExecutionId() !== executionId) {
      return null;
    }
    try {
      const [bundle, progress] = await Promise.all([
        this.detailLoader.load(executionId),
        firstValueFrom(this.api.progress(executionId)),
      ]);
      if (this.selectedExecutionId() !== executionId) {
        return null; // el usuario navegó a otra ejecución mientras cargaba
      }
      this.selectedExecution.set(bundle.detail);
      this.tasks.set(bundle.tasks);
      this.children.set(bundle.children);
      this.progress.set(progress);
      return { active: isActiveStatus(bundle.detail.status) };
    } catch {
      return { active: true }; // best-effort: un fallo transitorio no detiene el poll.
    }
  }
}
