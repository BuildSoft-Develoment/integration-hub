import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { Mt101AuditApiService } from '../api/mt101-audit-api.service';
import { Mt101CorrectionApply, Mt101CorrectionPreview } from '../models/mt101.models';

/** Contexto de la vista para el flujo de correccion masiva (set + filtros de export). */
export interface CorrectionCtx {
  fragmentSetId: string;
  connectionRef?: string;
  ruleCode?: string;
  status?: string;
}

/**
 * ADR-020 (C1/C2/C3): orquesta el flujo de la planilla de correccion (export -> preview -> apply) y su estado.
 * Extraido del componente de cuarentena para que el flujo inline y el asistente guiado (wizard, C4) compartan una
 * UNICA fuente de verdad. Se provee A NIVEL DE COMPONENTE (no root) para que cada vista tenga su propio estado.
 * Lo money-safe (coercion, merge-patch, audit) vive en el backend; aca solo va la orquestacion de UI + las 3
 * llamadas HTTP (que estan en el API service). El error/refresh se delegan al consumidor via callbacks.
 */
@Injectable()
export class Mt101CorrectionSheetFlowService {
  private readonly api = inject(Mt101AuditApiService);
  private readonly i18n = inject(I18nService);

  readonly exportingSheet = signal(false);
  readonly previewingSheet = signal(false);
  readonly applyingSheet = signal(false);
  readonly preview = signal<Mt101CorrectionPreview | null>(null);
  readonly applyResult = signal<Mt101CorrectionApply | null>(null);
  private file: File | null = null;

  /** Hay un archivo cargado (revisado en el preview) listo para aplicar. */
  hasFile(): boolean {
    return this.file !== null;
  }

  reset(): void {
    this.preview.set(null);
    this.applyResult.set(null);
    this.file = null;
  }

  clearPreview(): void {
    this.preview.set(null);
    this.file = null;
  }

  clearApplyResult(): void {
    this.applyResult.set(null);
  }

  /** C1: descarga la planilla de la vista (set + causa/estado). */
  exportSheet(ctx: CorrectionCtx, onError: (message: string) => void): void {
    if (!ctx.fragmentSetId.trim()) {
      return;
    }
    this.exportingSheet.set(true);
    this.api.mt101CorrectionSheet({
      fragmentSetId: ctx.fragmentSetId,
      connectionRef: ctx.connectionRef,
      ruleCode: ctx.ruleCode,
      status: ctx.status?.trim() || 'QUARANTINED',
    }).subscribe({
      next: (blob) => {
        const rule = ctx.ruleCode?.trim() ? '-' + ctx.ruleCode.trim() : '';
        this.downloadBlob(blob, `correccion-${ctx.fragmentSetId}${rule}.xlsx`);
        this.exportingSheet.set(false);
      },
      error: () => {
        onError(this.i18n.t('audit.quarantine.exportError'));
        this.exportingSheet.set(false);
      },
    });
  }

  /** C2: sube la planilla editada y guarda el dry-run (sin aplicar). Conserva el MISMO archivo para el apply. */
  loadPreview(ctx: CorrectionCtx, file: File, onError: (message: string) => void): void {
    if (!ctx.fragmentSetId.trim()) {
      return;
    }
    this.previewingSheet.set(true);
    this.preview.set(null);
    this.applyResult.set(null);
    this.file = file;
    this.api.mt101PreviewCorrectionSheet({
      fragmentSetId: ctx.fragmentSetId,
      connectionRef: ctx.connectionRef,
      file,
    }).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.previewingSheet.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        onError(err?.error?.message || this.i18n.t('audit.quarantine.previewError'));
        this.previewingSheet.set(false);
      },
    });
  }

  /** C3: aplica el MISMO archivo revisado (nada se reescribe entre revisar y aplicar). El backend es money-safe. */
  apply(ctx: CorrectionCtx, reason: string, ticketRef: string,
        onError: (message: string) => void, onApplied: () => void): void {
    if (!this.file) {
      return;
    }
    this.applyingSheet.set(true);
    this.api.mt101ApplyCorrectionSheet({
      fragmentSetId: ctx.fragmentSetId,
      connectionRef: ctx.connectionRef,
      reason,
      ticketRef,
      file: this.file,
    }).subscribe({
      next: (result) => {
        this.applyResult.set(result);
        this.preview.set(null);
        this.applyingSheet.set(false);
        onApplied();
      },
      error: (err: { error?: { message?: string } }) => {
        onError(err?.error?.message || this.i18n.t('audit.quarantine.applyError'));
        this.applyingSheet.set(false);
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
