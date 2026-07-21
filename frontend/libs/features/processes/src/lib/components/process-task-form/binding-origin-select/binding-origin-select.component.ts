import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ProcessTaskBindingOption } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

/**
 * Control composite de seleccion de ORIGEN (ADR-004): una zona que recibe DRAG desde la paleta y, al tocar el
 * chevron, abre un `mat-select` AGRUPADO con todos los origenes disponibles (metadata/summary/records/table/out/...)
 * para ELEGIR uno — el mismo patron `.mapping-select` que DB_WRITE, extraido a un componente compartido (SOLID:
 * lo usan DB_WRITE y FILE_WRITE por igual). No conoce el destino: recibe `groups` + `label` y emite `picked`/`cleared`.
 */
@Component({
  selector: 'ih-binding-origin-select',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './binding-origin-select.component.html',
  styleUrl: './binding-origin-select.component.css',
})
export class BindingOriginSelectComponent {
  readonly i18n = inject(I18nService);

  readonly groups = input.required<ReadonlyArray<{ key: string; items: readonly ProcessTaskBindingOption[] }>>();
  readonly draggingSource = input<ProcessTaskBindingOption | null>(null);
  readonly readonly = input(false);
  /** Etiqueta del origen actualmente elegido; vacio = sin origen (muestra el hint de drop). */
  readonly label = input('');

  readonly picked = output<ProcessTaskBindingOption>();
  readonly cleared = output<void>();

  readonly hovered = signal(false);

  filled(): boolean {
    return !!this.label().trim();
  }

  displayLabel(): string {
    if (this.filled()) {
      return this.label();
    }
    return this.draggingSource() ? this.i18n.t('ui.dbWriteDropReady') : this.i18n.t('ui.dbWriteDropAction');
  }

  groupLabel(groupKey: string): string {
    const translated = this.i18n.t(groupKey);
    return translated === groupKey ? groupKey : translated;
  }

  onPicked(option: ProcessTaskBindingOption | null): void {
    if (option) {
      this.picked.emit(option);
    }
  }

  allowDrop(event: DragEvent): void {
    if (!this.readonly()) {
      event.preventDefault();
    }
  }

  handleDragEnter(): void {
    if (!this.readonly() && this.draggingSource()) {
      this.hovered.set(true);
    }
  }

  handleDragLeave(): void {
    this.hovered.set(false);
  }

  handleDrop(event: DragEvent): void {
    if (this.readonly()) {
      return;
    }
    event.preventDefault();
    this.hovered.set(false);
    const source = this.draggingSource() ?? this.readFromTransfer(event);
    if (source) {
      this.picked.emit(source);
    }
  }

  private readFromTransfer(event: DragEvent): ProcessTaskBindingOption | null {
    const raw = event.dataTransfer?.getData('text/plain');
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as ProcessTaskBindingOption;
    } catch {
      return null;
    }
  }
}
