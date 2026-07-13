import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReaderDraft, ReaderProviderType } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { SchemaFormComponent, SchemaFormSchema, SchemaFormValue } from '@integration-hub/shared/ui';
import { ReaderConfigSchemaService } from '../../../api/reader-config-schema.service';
import { ReaderCsvFormComponent } from '../reader-csv-form/reader-csv-form.component';
import { ReaderExcelFormComponent } from '../reader-excel-form/reader-excel-form.component';
import { ReaderJsonFormComponent } from '../reader-json-form/reader-json-form.component';
import { ReaderSwiftMtFormComponent } from '../reader-swift-mt-form/reader-swift-mt-form.component';
import { ReaderTxtFormComponent } from '../reader-txt-form/reader-txt-form.component';
import { ReaderXmlFormComponent } from '../reader-xml-form/reader-xml-form.component';

/** Reader types con formulario frontend propio (rama @switch). El resto es schema-driven. */
const BUILTIN_READER_TYPES = new Set<string>(['TXT', 'CSV', 'XLS', 'XLSX', 'XML', 'SWIFT_MT', 'JSON']);

@Component({
  selector: 'ih-reader-type-form-host',
  standalone: true,
  imports: [CommonModule, ReaderTxtFormComponent, ReaderCsvFormComponent, ReaderExcelFormComponent, ReaderXmlFormComponent, ReaderJsonFormComponent, ReaderSwiftMtFormComponent, SchemaFormComponent],
    templateUrl: './reader-type-form-host.component.html'
})
export class ReaderTypeFormHostComponent {
  readonly i18n = inject(I18nService);
  private readonly configSchemas = inject(ReaderConfigSchemaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly readerType = input.required<ReaderProviderType>();
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();

  /** Verdadero cuando el tipo tiene un formulario propio en el @switch. */
  readonly isBuiltin = computed(() => BUILTIN_READER_TYPES.has(String(this.readerType()).toUpperCase()));

  // --- Camino schema-driven para reader types de plugin (sin form propio) ---
  // No es un fallback legacy: es el unico camino para un reader aportado por un plugin
  // backend que declara su config-schema pero no trae editor frontend. Sin schema con
  // campos, el host mantiene el "fail fast" explicito (mensaje de tipo no soportado).
  private readonly schemaState = signal<'loading' | 'none' | SchemaFormSchema>('none');

  readonly schema = computed<SchemaFormSchema | null>(() => {
    const state = this.schemaState();
    return typeof state === 'object' ? state : null;
  });

  readonly schemaLoading = computed(() => this.schemaState() === 'loading');

  /** Valor inicial del schema-form desde el draft (config del reader, sin el `type`). */
  readonly schemaValue = computed<SchemaFormValue>(() => {
    const { type: _type, ...rest } = this.draft() as unknown as Record<string, unknown>;
    return rest as SchemaFormValue;
  });

  constructor() {
    // Carga el config-schema del backend cuando el tipo no tiene form propio (reader de plugin).
    effect(() => {
      const builtin = this.isBuiltin();
      const type = this.readerType();
      untracked(() => {
        if (builtin) {
          this.schemaState.set('none');
          return;
        }
        this.schemaState.set('loading');
        this.configSchemas
          .schemaFor(type)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (schema) => this.schemaState.set(schema?.fields?.length ? schema : 'none'),
            error: () => this.schemaState.set('none'),
          });
      });
    });
  }

  /** Persiste el valor del schema-form como patch del draft del reader. */
  onSchemaValue(value: SchemaFormValue): void {
    this.patchDraft.emit(value as Partial<ReaderDraft>);
  }
}
