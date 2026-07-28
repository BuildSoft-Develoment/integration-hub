import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import {
  Mt101ParseFromTableTaskDraft,
} from '../../process-tasks';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { firstValueFrom } from 'rxjs';
import { ConnectionRef, ProcessTaskFormModel } from '@integration-hub/core/providers';
import { DbWriteTableRef } from '@integration-hub/shared/process-form-kit';
import { ConnectionIntrospectionApiService } from '@integration-hub/shared/process-form-kit';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';
import { ConnectionSelectComponent } from '@integration-hub/shared/process-form-kit';
import { ProcessDbWriteTableSelectorComponent } from '@integration-hub/shared/process-form-kit';

/**
 * Form propio de MT101_PARSE_FROM_TABLE (ya no reusa el de MT101_PARSE). Expone lo que el backend table-backed
 * lee: pageSize + replaceExisting + inboundSetIdTemplate + overrides de la tabla staging (table/connectionRef/
 * columnas). La tarea de origen (el DB_WRITE que stageo) se elige en el runtime-panel; los overrides en blanco
 * los deriva el backend de esa tarea.
 *
 * <p>La tabla usa el mismo patron que DB_WRITE/FILE_WRITE: con una conexion nombrada, autocomplete de tablas
 * reales (introspeccion best-effort); sin conexion (hereda de la tarea de origen) es texto libre.</p>
 */
@Component({
  selector: 'ih-process-mt101-parse-from-table-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
    ConnectionSelectComponent,
    ProcessDbWriteTableSelectorComponent,
  ],
  templateUrl: './process-mt101-parse-from-table-task-form.component.html',
  styleUrl: './process-mt101-parse-from-table-task-form.component.css',
})
export class ProcessMt101ParseFromTableTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);
  private readonly api = inject(ConnectionIntrospectionApiService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  // El host pasa `connections` a todos los forms; se usa en el picker de la conexion (override) de la fuente.
  readonly connections = input<readonly ConnectionRef[]>([]);
  readonly readonly = input(false);

  readonly draft = computed<Mt101ParseFromTableTaskDraft>(
    () => this.manager.draftFor<Mt101ParseFromTableTaskDraft>(this.task()),
  );

  // Introspeccion de tablas (patron DB_WRITE/FILE_WRITE): solo con conexion nombrada.
  readonly tables = signal<readonly DbWriteTableRef[]>([]);
  readonly tableQuery = signal('');
  readonly selectedConnection = computed(
    () => this.connections().find((c) => c.name === this.draft().source.connectionRef) ?? null,
  );
  private lastTablesKey = '';
  private lastHydratedTable = '';

  constructor() {
    // Hidrata el texto del autocomplete desde el valor COMMITEADO (config al abrir / seleccion). Guard tipo
    // DB_WRITE: editar otro campo NO pisa lo que el usuario esta tipeando en la tabla.
    effect(() => {
      const table = this.draft().source.table;
      untracked(() => {
        if (this.tableQuery() === '' || this.tableQuery() === this.lastHydratedTable) {
          this.tableQuery.set(table);
        }
        this.lastHydratedTable = table;
      });
    });
    // Al cambiar la conexion, recargar la lista de tablas del autocomplete.
    effect(() => {
      const connId = this.selectedConnection()?.id ?? null;
      const key = String(connId ?? '');
      if (key === this.lastTablesKey) return;
      this.lastTablesKey = key;
      untracked(() => {
        this.tables.set([]);
        if (connId != null) void this.loadTables(connId, '');
      });
    });
  }

  updateDraft(patch: Partial<Mt101ParseFromTableTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }

  updateSource(patch: Partial<Mt101ParseFromTableTaskDraft['source']>): void {
    this.updateDraft({ source: { ...this.draft().source, ...patch } });
  }

  handleSourceConnectionChange(connectionRef: string): void {
    // Al cambiar de conexion la tabla anterior puede no existir en la nueva -> se resetea (como DB_WRITE).
    this.tables.set([]);
    this.tableQuery.set('');
    this.updateSource({ connectionRef, table: '' });
  }

  // Autocomplete: al tipear filtra las tablas del server; NO commitea (evita ruido por tecla).
  onTableQuery(query: string): void {
    this.tableQuery.set(query);
    const connId = this.selectedConnection()?.id;
    if (connId != null) void this.loadTables(connId, String(query || '').trim());
  }

  // Al elegir del autocomplete se commitea el nombre CALIFICADO (schema.tabla), que el backend acepta
  // (DbTaskSupport.sanitizeQualifiedIdentifier).
  onTablePick(table: DbWriteTableRef): void {
    this.tableQuery.set(table.qualifiedName);
    this.updateSource({ table: table.qualifiedName });
  }

  private async loadTables(connectionId: number, query: string): Promise<void> {
    // Best-effort: si la introspeccion falla (rol insuficiente / conexion caida) se degrada a lista vacia y el
    // form sigue usable con texto libre.
    try {
      this.tables.set(await firstValueFrom(this.api.listConnectionTables(connectionId, { query })));
    } catch {
      this.tables.set([]);
    }
  }
}
