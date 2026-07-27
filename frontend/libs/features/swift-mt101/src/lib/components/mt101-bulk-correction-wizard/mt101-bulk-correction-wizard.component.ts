import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { I18nService } from '@integration-hub/core/services';
import { Mt101CorrectionApply } from '../../models/mt101.models';
import { CorrectionCtx, Mt101CorrectionSheetFlowService } from '../../services/mt101-correction-sheet-flow.service';

/** Datos que el opener (cuarentena) le pasa al wizard: el set + los filtros de la vista para el export. */
export interface BulkCorrectionWizardData {
  fragmentSetId: string;
  connectionRef?: string;
  ruleCode?: string;
  status?: string;
}

/**
 * ADR-020 (C4): asistente guiado de la correccion masiva — mismo flujo que el inline (export -> editar -> preview
 * -> aplicar) pero en 4 pasos que fuerzan el orden (no se aplica sin haber revisado el preview). Reusa el
 * {@link Mt101CorrectionSheetFlowService} (misma logica money-safe, cero backend). Se abre como dialogo desde la
 * pantalla de cuarentena y convive con los botones inline.
 */
@Component({
  selector: 'ih-mt101-bulk-correction-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatStepperModule, MatFormFieldModule, MatInputModule],
  templateUrl: './mt101-bulk-correction-wizard.component.html',
  styleUrl: './mt101-bulk-correction-wizard.component.css',
  providers: [Mt101CorrectionSheetFlowService],
})
export class Mt101BulkCorrectionWizardComponent {
  readonly flow = inject(Mt101CorrectionSheetFlowService);
  readonly i18n = inject(I18nService);
  readonly data = inject<BulkCorrectionWizardData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<Mt101BulkCorrectionWizardComponent, Mt101CorrectionApply | null>>(MatDialogRef);

  reason = '';
  ticketRef = '';
  readonly error = signal<string | null>(null);
  /** Hay un preview con filas a corregir -> se habilita avanzar al paso de aplicar. */
  readonly canApply = computed(() => {
    const preview = this.flow.preview();
    return !!preview && preview.toCorrect > 0;
  });

  private ctx(): CorrectionCtx {
    return {
      fragmentSetId: this.data.fragmentSetId,
      connectionRef: this.data.connectionRef,
      ruleCode: this.data.ruleCode,
      status: this.data.status,
    };
  }

  export(): void {
    this.error.set(null);
    this.flow.exportSheet(this.ctx(), (message) => this.error.set(message));
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite re-subir el mismo archivo
    if (!file) {
      return;
    }
    this.error.set(null);
    this.flow.loadPreview(this.ctx(), file, (message) => this.error.set(message));
  }

  apply(): void {
    if (!this.reason.trim()) {
      this.error.set(this.i18n.t('audit.quarantine.applyReasonRequired'));
      return;
    }
    this.error.set(null);
    this.flow.apply(this.ctx(), this.reason, this.ticketRef, (message) => this.error.set(message), () => undefined);
  }

  /** Cierra devolviendo el resultado (si aplico) para que la cuarentena refresque la lista. */
  close(): void {
    this.ref.close(this.flow.applyResult());
  }
}
