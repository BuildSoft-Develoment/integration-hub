// @trace ADR-016 (procesos: formulario de la tarea FILE_WRITE - layout header/detalle/trailer)
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import {
  FileWriteCellDraft,
  FileWriteColumnDraft,
  FileWriteSourceMode,
  FileWriteTableSourceDraft,
  FileWriteTaskDraft,
  FileWriteXlsxDraft,
  ProcessTaskFormBridgeService,
  ProcessTaskOutputKind,
} from '@integration-hub/core/providers';
import { COMMON_ENCODINGS, SuggestInputComponent } from '@integration-hub/shared/ui';
import { firstValueFrom } from 'rxjs';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef } from '../../../models/process.models';
import { ProcessApiService } from '../../../api/process-api.service';
import { DbWriteColumnRef, DbWriteTableRef } from '../../../models/process-db-write.models';
import { ProcessTaskBindingContextService } from '../../../forms/process-task-binding-context.service';
import { ProcessDbWriteTableSelectorComponent } from '../process-db-write-table-selector/process-db-write-table-selector.component';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';

type CellSection = 'header' | 'trailer';

@Component({
  selector: 'ih-process-file-write-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    SuggestInputComponent,
    ProcessDbWriteTableSelectorComponent,
    ProcessTaskRuntimePanelComponent,
  ],
  templateUrl: './process-file-write-task-form.component.html',
  styleUrl: '../file-task-form.shared.css',
})
export class ProcessFileWriteTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);
  private readonly api = inject(ProcessApiService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly connections = input<readonly ConnectionRef[]>([]);
  // El host pasa `readers` a todos los forms (registeredInputs); FILE_WRITE los usa para sugerir los campos
  // del `records` de un FILE_READ de origen (buildOptions del motor de binding ADR-004).
  readonly readers = input<readonly ReaderRef[]>([]);
  readonly readonly = input(false);

  readonly draft = computed<FileWriteTaskDraft>(() => this.manager.hydrateDraft<FileWriteTaskDraft>(this.task()) ?? {
    taskRef: this.task().clientId,
    executionMode: 'once',
    format: 'CSV',
    encoding: 'UTF-8',
    lineEnding: 'LF',
    delimiter: ',',
    quoteStrategy: 'REQUIRED',
    xlsx: { sheetName: '', headerStyle: 'BOLD', freezeHeader: true, autoFilter: false, autoSizeColumns: false },
    columns: [],
    header: [],
    trailer: [],
    archiveNameTemplate: '',
    sourceMode: 'records',
    tableSource: { table: '', connectionRef: '', orderBy: 'id', payloadColumn: '', batchSize: '' },
  });

  // 008: sugerencias del combo de codificacion (editable), consistente con los readers.
  readonly encodings = COMMON_ENCODINGS;
  // ADR-016: FILE_WRITE es once-task -> el selector de modo de ejecucion se restringe a 'once' (evita ofrecer
  // batch/per-record, que toTaskPatch igual fuerza a 'once' y rebotarian).
  readonly executionModes = ['once'] as const;

  readonly isTxt = computed(() => this.draft().format === 'TXT');
  readonly isCsv = computed(() => this.draft().format === 'CSV');
  readonly isXlsx = computed(() => this.draft().format === 'XLSX');
  readonly isTableSource = computed(() => this.draft().sourceMode === 'table');

  // ADR-004: FILE_WRITE escribe un STREAM de filas al detalle, y solo `records`/`table`/`errors` son streams
  // consumibles (el backend FileWriteTaskProvider.toRecords acepta ReadResult/List). `summary`/`metadata`/`out`
  // son Map-shaped (0 filas) -> su lugar es la celda header/trailer, no el detalle. Por eso el selector de salida
  // de origen se restringe a estos tres, interseccion con lo que la tarea de origen realmente publica.
  private readonly consumableOutputs: readonly ProcessTaskOutputKind[] = ['records', 'table', 'errors'];

  readonly sourceTask = computed(() =>
    this.bindingContext.resolveTaskByRef(this.draft().input?.sourceTaskRef || '', this.tasks()),
  );
  readonly availableSourceOutputs = computed<ProcessTaskOutputKind[]>(() => {
    const task = this.sourceTask();
    if (!task) return [];
    return this.bindingContext.availableOutputsForTask(task).filter((kind) => this.consumableOutputs.includes(kind));
  });
  readonly selectedSourceOutput = computed<ProcessTaskOutputKind>(
    () => (this.draft().input?.sourceOutput as ProcessTaskOutputKind) || 'records',
  );

  updateXlsx(patch: Partial<FileWriteXlsxDraft>): void {
    this.updateDraft({ xlsx: { ...this.draft().xlsx, ...patch } });
  }

  // Cambia la salida de origen (records/table/errors) que alimenta el detalle; conserva la tarea de origen.
  setSourceOutput(output: ProcessTaskOutputKind): void {
    const input = this.draft().input;
    if (!input?.sourceTaskRef) return;
    this.updateDraft({ input: { ...input, source: 'task-output', sourceOutput: output } });
  }

  // --- introspeccion de la fuente-tabla (patron DB_WRITE): elegir la tabla por autocomplete y sugerir
  //     las columnas REALES de la tabla en cada `field` del detalle ("alinear campos" con la fuente). ---
  readonly tables = signal<readonly DbWriteTableRef[]>([]);
  readonly columns = signal<readonly DbWriteColumnRef[]>([]);
  // Texto del autocomplete (mientras se escribe/filtra); el valor COMMITEADO vive en draft.tableSource.table.
  readonly tableQuery = signal('');

  readonly selectedConnection = computed(() =>
    this.connections().find((c) => c.name === this.draft().tableSource.connectionRef) ?? null,
  );
  // Sugerencias del `field` de cada columna de detalle. Combo EDITABLE en ambos modos:
  //  - modo tabla: columnas REALES de la tabla introspectada (o claves libres si hay payloadColumn JSON).
  //  - modo records: los campos del output-kind elegido de la tarea de origen (buildOptions del motor de
  //    binding ADR-004): p.ej. los campos del reader de un FILE_READ, o las columnas de un DB_WRITE.table.
  readonly fieldSuggestions = computed(() =>
    this.isTableSource() ? this.columns().map((c) => c.name) : this.recordFieldSuggestions(),
  );

  private readonly recordFieldSuggestions = computed<string[]>(() => {
    if (this.isTableSource() || !this.sourceTask()) return [];
    const kind = this.selectedSourceOutput();
    return this.bindingContext
      .buildOptions(this.task(), this.tasks(), this.readers(), this.draft().input)
      .filter((option) => option.kind === kind)
      .map((option) => option.key);
  });

  private lastTablesKey = '';
  private lastColumnsKey = '';
  private lastHydratedTable = '';

  constructor() {
    // Hidrata el texto del autocomplete desde el valor COMMITEADO (config al abrir / seleccion). Guard tipo DB_WRITE:
    // solo sincroniza si NO hay tipeo en progreso (tableQuery vacio o igual al ultimo hidratado) -> editar otro campo
    // NO pisa lo que el usuario esta escribiendo en la tabla. La seleccion (onTablePick) actualiza tableQuery aparte.
    effect(() => {
      const table = this.draft().tableSource.table;
      untracked(() => {
        if (this.tableQuery() === '' || this.tableQuery() === this.lastHydratedTable) {
          this.tableQuery.set(table);
        }
        this.lastHydratedTable = table;
      });
    });
    // Al cambiar la conexion (o entrar en modo tabla), recargar la lista de tablas del autocomplete.
    effect(() => {
      const connId = this.isTableSource() ? this.selectedConnection()?.id ?? null : null;
      const key = String(connId ?? '');
      if (key === this.lastTablesKey) return;
      this.lastTablesKey = key;
      untracked(() => {
        this.tables.set([]);
        if (connId != null) void this.loadTables(connId, '');
      });
    });
    // Introspecciona columnas al cambiar conexion + tabla COMMITEADA (select/hidratacion), no al tipear.
    effect(() => {
      const connId = this.isTableSource() ? this.selectedConnection()?.id ?? null : null;
      const table = this.draft().tableSource.table.trim();
      const key = `${connId ?? 'none'}|${table}`;
      if (key === this.lastColumnsKey) return;
      this.lastColumnsKey = key;
      untracked(() => {
        if (connId != null && table) void this.loadColumns(connId, table);
        else this.columns.set([]);
      });
    });
  }

  setSourceMode(mode: FileWriteSourceMode): void {
    this.updateDraft({ sourceMode: mode });
  }

  updateTableSource(patch: Partial<FileWriteTableSourceDraft>): void {
    this.updateDraft({ tableSource: { ...this.draft().tableSource, ...patch } });
  }

  handleConnectionChange(connectionRef: string): void {
    // Al cambiar de conexion la tabla anterior puede no existir en la nueva -> se resetea (como DB_WRITE).
    this.tables.set([]);
    this.columns.set([]);
    this.tableQuery.set('');
    this.updateTableSource({ connectionRef, table: '' });
  }

  // Autocomplete: al tipear filtra las tablas del server; NO commitea (evita introspeccionar columnas por tecla).
  onTableQuery(query: string): void {
    this.tableQuery.set(query);
    const connId = this.selectedConnection()?.id;
    if (connId != null) void this.loadTables(connId, String(query || '').trim());
  }

  // Al elegir una tabla del autocomplete se commitea el nombre CALIFICADO (schema.tabla) -> el effect carga columnas.
  // Se actualiza tambien tableQuery para que el texto mostrado coincida con lo commiteado.
  onTablePick(table: DbWriteTableRef): void {
    this.tableQuery.set(table.qualifiedName);
    this.updateTableSource({ table: table.qualifiedName });
  }

  private async loadTables(connectionId: number, query: string): Promise<void> {
    // Introspeccion best-effort: si falla (rol insuficiente / conexion caida) se degrada a lista vacia
    // (el autocomplete no ofrece nada, pero el form sigue usable con texto libre).
    try {
      this.tables.set(await firstValueFrom(this.api.listConnectionTables(connectionId, { query })));
    } catch {
      this.tables.set([]);
    }
  }

  private async loadColumns(connectionId: number, qualifiedTable: string): Promise<void> {
    const dot = qualifiedTable.lastIndexOf('.');
    const schema = dot > 0 ? qualifiedTable.slice(0, dot) : undefined;
    const table = dot > 0 ? qualifiedTable.slice(dot + 1) : qualifiedTable;
    try {
      this.columns.set(await firstValueFrom(this.api.listConnectionColumns(connectionId, { schema, table })));
    } catch {
      this.columns.set([]);
    }
  }

  updateDraft(patch: Partial<FileWriteTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }

  // --- columnas de detalle ---
  addColumn(): void {
    this.updateDraft({ columns: [...this.draft().columns, { field: '' }] });
  }

  removeColumn(index: number): void {
    this.updateDraft({ columns: this.draft().columns.filter((_, i) => i !== index) });
  }

  updateColumn(index: number, patch: Partial<FileWriteColumnDraft>): void {
    this.updateDraft({ columns: this.draft().columns.map((column, i) => (i === index ? { ...column, ...patch } : column)) });
  }

  // --- celdas de cabecera / trailer ---
  cells(section: CellSection): FileWriteCellDraft[] {
    return section === 'header' ? this.draft().header : this.draft().trailer;
  }

  addCell(section: CellSection): void {
    this.setCells(section, [...this.cells(section), { kind: 'value', value: '' }]);
  }

  removeCell(section: CellSection, index: number): void {
    this.setCells(section, this.cells(section).filter((_, i) => i !== index));
  }

  updateCell(section: CellSection, index: number, patch: Partial<FileWriteCellDraft>): void {
    this.setCells(section, this.cells(section).map((cell, i) => (i === index ? { ...cell, ...patch } : cell)));
  }

  private setCells(section: CellSection, cells: FileWriteCellDraft[]): void {
    this.updateDraft(section === 'header' ? { header: cells } : { trailer: cells });
  }
}
