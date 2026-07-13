import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SourceDraft, SourceProviderType } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { SchemaFormComponent, SchemaFormSchema, SchemaFormValue } from '@integration-hub/shared/ui';
import { SourceConfigSchemaService } from '../../../api/source-config-schema.service';
import { SourceFilesystemFormComponent } from '../source-filesystem-form/source-filesystem-form.component';
import { SourceFtpFormComponent } from '../source-ftp-form/source-ftp-form.component';
import { SourceRestFormComponent } from '../source-rest-form/source-rest-form.component';
import { SourceS3FormComponent } from '../source-s3-form/source-s3-form.component';
import { SourceGcsFormComponent } from '../source-gcs-form/source-gcs-form.component';
import { SourceAzureBlobFormComponent } from '../source-azure-blob-form/source-azure-blob-form.component';
import { SourceOciFormComponent } from '../source-oci-form/source-oci-form.component';
import { SourceSftpFormComponent } from '../source-sftp-form/source-sftp-form.component';

/** Source types con formulario frontend propio (rama @switch). El resto es schema-driven. */
const BUILTIN_SOURCE_TYPES = new Set<string>([
  'FILESYSTEM', 'FTP', 'SFTP', 'REST', 'S3', 'GCS', 'AZURE_BLOB', 'OCI_OBJECT_STORAGE',
]);
/** Campos estructurales del SourceDraft que no forman parte del config del plugin. */
const STRUCTURAL_KEYS = new Set(['type', 'connectionKind', 'pollingMode', 'includePatterns']);

@Component({
  selector: 'ih-source-type-form-host',
  standalone: true,
  imports: [CommonModule, SourceFilesystemFormComponent, SourceFtpFormComponent, SourceSftpFormComponent, SourceRestFormComponent, SourceS3FormComponent, SourceGcsFormComponent, SourceAzureBlobFormComponent, SourceOciFormComponent, SchemaFormComponent],
  template: `
    @switch (sourceType()) {
      @case ('FILESYSTEM') { <ih-source-filesystem-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('FTP') { <ih-source-ftp-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('SFTP') { <ih-source-sftp-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('REST') { <ih-source-rest-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('S3') { <ih-source-s3-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('GCS') { <ih-source-gcs-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('AZURE_BLOB') { <ih-source-azure-blob-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('OCI_OBJECT_STORAGE') { <ih-source-oci-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @default {
        <!-- Source aportado por un plugin backend: sin form propio, se renderiza su config-schema. -->
        @if (schema(); as sc) {
          <ih-schema-form [schema]="sc" [value]="schemaValue()" [readonly]="readonly()" (valueChange)="onSchemaValue($event)" />
        } @else if (schemaLoading()) {
          <p class="source-type-form-host__loading">{{ i18n.t('ui.loading') }}</p>
        } @else {
          <p class="source-type-form-host__unsupported" role="alert">
            {{ i18n.t('common.unsupportedType') }}: <code>{{ sourceType() }}</code>
          </p>
        }
      }
    }
  `,
})
export class SourceTypeFormHostComponent {
  readonly i18n = inject(I18nService);
  private readonly configSchemas = inject(SourceConfigSchemaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sourceType = input.required<SourceProviderType>();
  readonly draft = input.required<SourceDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<SourceDraft>>();

  /** Verdadero cuando el tipo tiene un formulario propio en el @switch. */
  readonly isBuiltin = computed(() => BUILTIN_SOURCE_TYPES.has(String(this.sourceType()).toUpperCase()));

  // --- Camino schema-driven para source types de plugin (sin form propio) ---
  // No es un fallback legacy: es el unico camino para un source aportado por un plugin backend
  // que declara su config-schema pero no trae editor frontend. Sin schema con campos, el host
  // muestra el "fail fast" explicito (mensaje de tipo no soportado).
  private readonly schemaState = signal<'loading' | 'none' | SchemaFormSchema>('none');

  readonly schema = computed<SchemaFormSchema | null>(() => {
    const state = this.schemaState();
    return typeof state === 'object' ? state : null;
  });

  readonly schemaLoading = computed(() => this.schemaState() === 'loading');

  /** Valor inicial del schema-form desde el draft (config del plugin, sin campos estructurales). */
  readonly schemaValue = computed<SchemaFormValue>(() => {
    const entries = Object.entries(this.draft() as unknown as Record<string, unknown>)
      .filter(([key]) => !STRUCTURAL_KEYS.has(key));
    return Object.fromEntries(entries) as SchemaFormValue;
  });

  constructor() {
    // Carga el config-schema del backend cuando el tipo no tiene form propio (source de plugin).
    effect(() => {
      const builtin = this.isBuiltin();
      const type = this.sourceType();
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

  /** Persiste el valor del schema-form como patch del draft del source. */
  onSchemaValue(value: SchemaFormValue): void {
    this.patchDraft.emit(value as Partial<SourceDraft>);
  }
}
