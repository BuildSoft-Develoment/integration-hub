import { CommonModule } from '@angular/common';
import { Component, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
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
  /** Opt-in: habilita un boton "lapiz" para TIPEAR un valor libre (columnas no introspectables, claves JSON).
   *  Default off -> DB_WRITE/MT101 no cambian; solo FILE_WRITE (modo tabla) lo activa. */
  readonly allowCustom = input(false);

  readonly picked = output<ProcessTaskBindingOption>();
  readonly cleared = output<void>();
  /** Valor libre confirmado (Enter/blur) cuando allowCustom. El padre decide su significado (aca: el `field`). */
  readonly customEntered = output<string>();
  /** true al entrar el drag sobre la zona, false al salir/soltar. Lo usa DB_WRITE para su papelera; FILE_WRITE lo ignora. */
  readonly hoverChange = output<boolean>();

  readonly hovered = signal(false);
  readonly editing = signal(false);
  private readonly picker = viewChild<MatSelect>('picker');
  private readonly customInput = viewChild<ElementRef<HTMLInputElement>>('customInput');

  constructor() {
    // Al entrar en modo edicion, enfocar+seleccionar el input inline (reactivo a que el @if lo renderice).
    effect(() => {
      const el = this.customInput()?.nativeElement;
      if (this.editing() && el) {
        el.focus();
        el.select();
      }
    });
  }

  // --- Valor personalizado (allowCustom): tipear un `field` que no esta en la lista (ni introspectado). ---
  startCustom(): void {
    if (!this.readonly()) this.editing.set(true);
  }
  commitCustom(value: string): void {
    if (!this.editing()) return; // Enter ya commiteo -> el blur posterior no re-emite; Escape dejo editing=false.
    this.editing.set(false);
    const next = (value || '').trim();
    if (next && next !== this.label().trim()) {
      this.customEntered.emit(next);
    }
  }
  cancelCustom(): void {
    this.editing.set(false);
  }

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
    // Elegir "Ninguno" (null) limpia el destino — coherente con el boton de limpiar.
    if (option) {
      this.picked.emit(option);
    } else {
      this.cleared.emit();
    }
    // Reset del mat-select a null tras cada eleccion. Sin esto el select "recuerda" la ultima opcion (el binding
    // [value]="null" es constante y Angular no lo re-aplica), asi que re-elegir la MISMA opcion tras limpiar no
    // disparaba selectionChange. El set PROGRAMATICO de value NO emite selectionChange (solo la interaccion), asi
    // que este reset no re-invoca onPicked.
    const select = this.picker();
    if (select) {
      select.value = null;
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
      this.hoverChange.emit(true);
    }
  }

  handleDragLeave(): void {
    this.hovered.set(false);
    this.hoverChange.emit(false);
  }

  handleDrop(event: DragEvent): void {
    if (this.readonly()) {
      return;
    }
    event.preventDefault();
    this.hovered.set(false);
    this.hoverChange.emit(false);
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
