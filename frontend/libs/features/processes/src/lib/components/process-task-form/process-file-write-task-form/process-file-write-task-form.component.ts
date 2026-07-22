// @trace ADR-016 (procesos: formulario de la tarea FILE_WRITE - layout header/detalle/trailer)
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import {
  FileWriteBindingOutput,
  FileWriteCellDraft,
  FileWriteColumnDraft,
  FileWriteTableSourceDraft,
  FileWriteTaskDraft,
  FileWriteXlsxDraft,
  ProcessTaskBindingOption,
  ProcessTaskFormBridgeService,
  ProcessTaskOutputKind,
} from '@integration-hub/core/providers';
import { COMMON_ENCODINGS, SuggestInputComponent } from '@integration-hub/shared/ui';
import { firstValueFrom } from 'rxjs';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef } from '../../../models/process.models';
import { ProcessApiService } from '../../../api/process-api.service';
import { DbWriteColumnRef, DbWriteSourceItem, DbWriteTableRef } from '../../../models/process-db-write.models';
import { ProcessTaskBindingContextService } from '../../../forms/process-task-binding-context.service';
import { BindingOriginSelectComponent } from '../binding-origin-select/binding-origin-select.component';
import { ProcessDbWriteSourcePaletteComponent } from '../process-db-write-source-palette/process-db-write-source-palette.component';
import { ProcessDbWriteTableSelectorComponent } from '../process-db-write-table-selector/process-db-write-table-selector.component';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../task-form-shell/task-form-shell.component';
import { ConnectionSelectComponent } from '../connection-select/connection-select.component';

type CellSection = 'header' | 'trailer';
// Origenes que FILE_WRITE consume como STREAM de filas (van al detalle).
const STREAM_KINDS: ReadonlyArray<ProcessTaskOutputKind> = ['records', 'table', 'errors'];
// Origenes AGREGADOS que van a una celda de cabecera/trailer (Map-shaped).
const CELL_KINDS: ReadonlyArray<ProcessTaskOutputKind> = ['summary', 'out'];
// metadata transversal que FILE_WRITE resuelve (el motor la publica en attributes["metadata"], igual que DB_WRITE).
// Los tokens de lote (_batch*) se omiten: FILE_WRITE es once-task, no hay slices.
const SUPPORTED_METADATA = [
  '_processExecutionId',
  '_taskDefinitionId',
  '_taskOrder',
  '_taskType',
  '_taskRef',
  '_executionMode',
  '_triggerSource',
];

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
    MatTabsModule,
    SuggestInputComponent,
    BindingOriginSelectComponent,
    ProcessDbWriteSourcePaletteComponent,
    ProcessDbWriteTableSelectorComponent,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
    ConnectionSelectComponent,
  ],
  templateUrl: './process-file-write-task-form.component.html',
  // El shared css trae las clases de CONTENIDO (task-grid/detail-row/write-workspace/...) compartidas con
  // FILE_COMPRESS/FILE_DELIVER; el css propio (segundo, gana) solo cambia el :host al modelo del shell
  // (altura fija; el scroll lo maneja cada tab), sin tocar el shared que usan los otros forms.
  styleUrls: ['../file-task-form.shared.css', './process-file-write-task-form.component.css'],
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
  // El modo se DERIVA (no hay toggle, paridad con DB_WRITE): con tarea de origen -> records; sin tarea -> tabla directa.
  readonly isTableSource = computed(() => !this.draft().input?.sourceTaskRef);

  // El detalle de FILE_WRITE lee la salida POR DEFECTO de la tarea de origen (records para FILE_READ/MT101, table
  // para DB_WRITE, etc.) — el runtime panel la setea al elegir la tarea (defaultOutputForTask). No hay selector de
  // "salida de origen" (paridad con DB_WRITE); selectedSourceOutput solo determina que campos ofrece el composite.
  readonly sourceTask = computed(() =>
    this.bindingContext.resolveTaskByRef(this.draft().input?.sourceTaskRef || '', this.tasks()),
  );
  readonly selectedSourceOutput = computed<ProcessTaskOutputKind>(
    () => (this.draft().input?.sourceOutput as ProcessTaskOutputKind) || 'records',
  );

  updateXlsx(patch: Partial<FileWriteXlsxDraft>): void {
    this.updateDraft({ xlsx: { ...this.draft().xlsx, ...patch } });
  }

  // --- Paleta de origenes + drag&drop (patron DB_WRITE: reusa la paleta y el motor de binding ADR-004) ---
  readonly draggingSource = signal<DbWriteSourceItem | null>(null);

  // metadata transversal como opciones de origen (el motor la publica en attributes["metadata"], igual que DB_WRITE).
  // Reusada por la paleta, el picker del detalle y el de celdas para no duplicar la lista de 7 tokens.
  private readonly metadataOptions: ProcessTaskBindingOption[] = SUPPORTED_METADATA.map((key) => ({
    key,
    label: key,
    kind: 'metadata' as const,
    groupKey: 'ui.dbWriteGroup.metadata',
  }));

  // Modo tabla directa (sin tarea de origen): las columnas introspectadas de la tabla SON los origenes -> se ofrecen
  // como fuentes (paleta + detalle), igual que los campos de una tarea de origen en modo records. kind:'table' para
  // que acceptsDetailOrigin las acepte (STREAM_KINDS) al arrastrarlas a una columna de detalle.
  private readonly tableColumnOptions = computed<ProcessTaskBindingOption[]>(() =>
    this.columns().map((c) => ({ key: c.name, label: c.name, kind: 'table' as const, groupKey: 'ui.write.tableColumnsGroup' })),
  );

  // Origenes de la TAREA de origen (modo records), filtrados a lo que FILE_WRITE consume: streams (records/table/
  // errors) para el detalle, agregados (summary/out) + metadata(7 soportados) para celdas. Se excluye fragments y el
  // resto de metadata (que el backend no resuelve) para no ofrecer origenes muertos (no-fallback).
  private readonly recordsPaletteOptions = computed<ProcessTaskBindingOption[]>(() => {
    if (this.isTableSource() || !this.sourceTask()) return [];
    return this.bindingContext
      .buildOptions(this.task(), this.tasks(), this.readers(), this.draft().input)
      .filter(
        (option) =>
          STREAM_KINDS.includes(option.kind as ProcessTaskOutputKind) ||
          CELL_KINDS.includes(option.kind as ProcessTaskOutputKind) ||
          (option.kind === 'metadata' && SUPPORTED_METADATA.includes(option.key)),
      );
  });
  // Paleta segun el modo derivado: tabla directa -> columnas de la tabla + metadata (no hay tarea -> no summary/out);
  // records -> origenes de la tarea de origen.
  private readonly paletteOptions = computed<ProcessTaskBindingOption[]>(() =>
    this.isTableSource() ? [...this.tableColumnOptions(), ...this.metadataOptions] : this.recordsPaletteOptions(),
  );
  readonly groupedSources = computed(
    () =>
      this.bindingContext.groupOptions(this.paletteOptions()) as ReadonlyArray<{
        key: string;
        items: readonly DbWriteSourceItem[];
      }>,
  );
  // La paleta se muestra en AMBOS modos (paridad total): records = origenes de la tarea; tabla directa = columnas
  // introspectadas + metadata. Sin conexion/tabla aun, ofrece al menos la metadata (siempre resoluble).
  readonly showPalette = computed(() => this.paletteOptions().length > 0);

  private readOption(event: DragEvent): ProcessTaskBindingOption | null {
    const source = this.draggingSource();
    if (source) return source;
    const raw = event.dataTransfer?.getData('text/plain');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ProcessTaskBindingOption;
    } catch {
      return null;
    }
  }

  allowDrop(event: DragEvent): void {
    if (!this.readonly() && this.showPalette()) event.preventDefault();
  }

  // Drop sobre una columna de detalle: acepta stream (records/table/errors) o metadata -> setea el `field`.
  dropOnColumn(index: number, event: DragEvent): void {
    event.preventDefault();
    const option = this.readOption(event);
    this.draggingSource.set(null);
    if (option && this.acceptsDetailOrigin(option.kind)) {
      this.updateColumn(index, { field: option.key });
    }
  }

  // Drop sobre una celda header/trailer: metadata -> celda metadata; summary/out -> celda binding.
  dropOnCell(section: CellSection, index: number, event: DragEvent): void {
    event.preventDefault();
    const option = this.readOption(event);
    this.draggingSource.set(null);
    if (!option) return;
    if (option.kind === 'metadata') {
      this.updateCell(section, index, { kind: 'metadata', metadata: option.key });
    } else if (CELL_KINDS.includes(option.kind as ProcessTaskOutputKind)) {
      this.updateCell(section, index, {
        kind: 'binding',
        sourceOutput: option.kind as FileWriteBindingOutput,
        sourceTaskRef: this.draft().input?.sourceTaskRef || '',
        sourceKey: option.key,
      });
    }
  }

  // --- Picker composite de origen para celdas de cabecera/trailer (paridad con el detalle y DB_WRITE) ---
  // Origenes de una celda: ESPECIALES (constante/count/sum) + metadata(2 soportados) + summary/out de la tarea de
  // origen. Los per-registro (records/table) NO aplican a una celda (once, sin "registro actual"). El picker unifica
  // lo que antes eran el selector de kind + 4 ramas de subcontroles.
  readonly cellOriginGroups = computed(() => {
    // Los especiales se rutean por `key` (no por `kind`); `kind:'field'` es solo un valor neutro valido.
    const specials: ProcessTaskBindingOption[] = [
      { key: '__value__', label: this.i18n.t('ui.write.kindValue'), kind: 'field', groupKey: 'ui.write.cellSpecialGroup' },
      { key: '__count__', label: 'count', kind: 'field', groupKey: 'ui.write.cellSpecialGroup' },
      { key: '__sum__', label: 'sum', kind: 'field', groupKey: 'ui.write.cellSpecialGroup' },
    ];
    const aggregates = this.paletteOptions().filter((option) => CELL_KINDS.includes(option.kind as ProcessTaskOutputKind));
    return this.bindingContext.groupOptions([...specials, ...this.metadataOptions, ...aggregates]);
  });

  // Etiqueta del origen actual de una celda (lo que muestra el composite cuando esta "filled").
  cellOriginLabel(cell: FileWriteCellDraft): string {
    switch (cell.kind) {
      case 'metadata':
        return cell.metadata || '_processExecutionId';
      case 'aggregate':
        return cell.aggregate === 'sum' ? `sum(${cell.field || ''})` : 'count';
      case 'binding':
        return `${cell.sourceOutput || 'summary'}.${cell.sourceKey || ''}`;
      default:
        return this.i18n.t('ui.write.kindValue');
    }
  }

  // Mapea el origen elegido/arrastrado al kind + valor de la celda.
  onCellOriginPicked(section: CellSection, index: number, option: ProcessTaskBindingOption): void {
    if (option.key === '__value__') {
      this.updateCell(section, index, { kind: 'value' });
    } else if (option.key === '__count__') {
      this.updateCell(section, index, { kind: 'aggregate', aggregate: 'count' });
    } else if (option.key === '__sum__') {
      this.updateCell(section, index, { kind: 'aggregate', aggregate: 'sum' });
    } else if (option.kind === 'metadata') {
      this.updateCell(section, index, { kind: 'metadata', metadata: option.key });
    } else if (CELL_KINDS.includes(option.kind as ProcessTaskOutputKind)) {
      this.updateCell(section, index, {
        kind: 'binding',
        sourceOutput: option.kind as FileWriteBindingOutput,
        sourceTaskRef: this.draft().input?.sourceTaskRef || '',
        sourceKey: option.key,
      });
    }
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
  // Campos de DATOS disponibles (sin metadata) para el argumento de sum() de una celda: columnas REALES de la tabla
  // introspectada (modo tabla) o los campos del output-kind de la tarea de origen (modo records).
  readonly dataFieldSuggestions = computed<string[]>(() =>
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

  // Origenes del picker composite de una columna de detalle + metadata(7 tokens, mismo valor en cada fila):
  //  - modo tabla directa: las columnas introspectadas de la tabla (kind 'table').
  //  - modo records: los campos del stream elegido (records/table/errors del sourceOutput actual).
  readonly detailOriginGroups = computed(() => {
    if (this.isTableSource()) {
      return this.bindingContext.groupOptions([...this.tableColumnOptions(), ...this.metadataOptions]);
    }
    const kind = this.selectedSourceOutput();
    const stream = this.paletteOptions().filter((option) => option.kind === kind);
    return this.bindingContext.groupOptions([...stream, ...this.metadataOptions]);
  });

  // Stream (records/table/errors) o metadata alimentan una columna de detalle -> setean el `field` (el backend
  // inyecta el token de metadata por fila). Un origen agregado summary/out mal arrastrado se ignora (va a celda).
  private acceptsDetailOrigin(kind: string): boolean {
    return STREAM_KINDS.includes(kind as ProcessTaskOutputKind) || kind === 'metadata';
  }

  onDetailOriginPicked(index: number, option: ProcessTaskBindingOption): void {
    if (this.acceptsDetailOrigin(option.kind)) {
      this.updateColumn(index, { field: option.key });
    }
  }

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

  // Activa/desactiva el modo expresion (fx) de una columna: ON = expression '' (input visible); OFF = undefined.
  toggleExpression(index: number): void {
    const on = this.draft().columns[index].expression != null;
    this.updateColumn(index, { expression: on ? undefined : '' });
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
